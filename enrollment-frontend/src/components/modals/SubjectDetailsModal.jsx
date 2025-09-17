import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookMarked, Plus, ChevronDown, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subjectAPI } from '@/services/api';
import ScheduleModal from './ScheduleModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SubjectDetailsModal = ({ 
  isOpen, 
  onClose, 
  course = null,
  programType = null,
  onAddSubject = () => {},
  onEditSubject = () => {},
  onDeleteSubject = () => {}
}) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('1st Year');
  const [selectedSemester, setSelectedSemester] = useState('1st Semester');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Get year and semester options based on program type
  const getYearOptions = () => {
    switch (programType) {
      case 'SHS':
        return ['Grade 11', 'Grade 12'];
      case 'Bachelor':
        return ['1st Year', '2nd Year', '3rd Year', '4th Year'];
      case 'Diploma':
      default:
        return ['1st Year', '2nd Year', '1st Year Summer', '2nd Year Summer'];
    }
  };

  const getSemesterOptions = () => {
    return ['1st Semester', '2nd Semester'];
  };
  
  // Initialize selected year based on program type
  useEffect(() => {
    if (programType === 'SHS') {
      setSelectedYear('Grade 11');
    } else {
      setSelectedYear('1st Year');
    }
  }, [programType]);
  
  // Fetch subjects when course changes or modal opens
  useEffect(() => {
    if (isOpen && course) {
      fetchSubjects();
    }
  }, [isOpen, course]);

  const fetchSubjects = async () => {
    if (!course) return;
    
    setLoading(true);
    try {
      const response = await subjectAPI.getByCourse(course.id);
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects based on selected year and semester
  const filteredSubjects = subjects.filter(subject => {
    return (
      (selectedYear === 'All Years' || selectedYear === 'All Grades' || subject.year === selectedYear) &&
      (selectedSemester === 'All Semesters' || subject.semester === selectedSemester)
    );
  });

  // Helper function to determine which columns to show based on program type
  const shouldShowColumn = (columnName) => {
    if (!programType) return true; // Show all columns if program type is not available
    
    switch (programType) {
      case 'Bachelor':
        // Show all columns except number_of_hours
        return columnName !== 'number_of_hours';
      case 'SHS':
        // Show subject_code, descriptive_title, number_of_hours, year, semester
        return ['subject_code', 'descriptive_title', 'number_of_hours', 'year', 'semester'].includes(columnName);
      case 'Diploma':
        // Show subject_code, descriptive_title, year, semester
        return ['subject_code', 'descriptive_title', 'year', 'semester'].includes(columnName);
      default:
        return true;
    }
  };

  // Animation variants
  const modalVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold heading-bold text-gray-900 flex items-center">
                  <BookMarked className="w-6 h-6 text-[var(--dominant-red)] mr-3" />
                  {course ? `${course.course_name} Subjects` : 'Course Subjects'}
                  {programType && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({programType} Program)
                    </span>
                  )}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Filters and Add Button */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-4">
                    {/* Year/Grade Dropdown */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="flex items-center justify-between w-36"
                        onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                      >
                        {selectedYear}
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                      {isYearDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="py-1">
                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                              onClick={() => {
                                setSelectedYear(programType === 'SHS' ? 'All Grades' : 'All Years');
                                setIsYearDropdownOpen(false);
                              }}
                            >
                              {programType === 'SHS' ? 'All Grades' : 'All Years'}
                            </button>
                            {getYearOptions().map((year) => (
                              <button
                                key={year}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedYear(year);
                                  setIsYearDropdownOpen(false);
                                }}
                              >
                                {year}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Semester Dropdown */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        className="flex items-center justify-between w-40"
                        onClick={() => setIsSemesterDropdownOpen(!isSemesterDropdownOpen)}
                      >
                        {selectedSemester}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                      {isSemesterDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                          <div className="py-1">
                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                              onClick={() => {
                                setSelectedSemester('All Semesters');
                                setIsSemesterDropdownOpen(false);
                              }}
                            >
                              All Semesters
                            </button>
                            {getSemesterOptions().map((semester) => (
                              <button
                                key={semester}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedSemester(semester);
                                  setIsSemesterDropdownOpen(false);
                                }}
                              >
                                {semester}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Subject Button */}
                  <Button
                    className="gradient-primary text-white liquid-button"
                    onClick={() => onAddSubject(course)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subject
                  </Button>
                </div>

                {/* Subjects Table */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dominant-red)]"></div>
                  </div>
                ) : subjects.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {shouldShowColumn('subject_code') && (
                            <TableHead className="w-[120px]">Subject Code</TableHead>
                          )}
                          {shouldShowColumn('descriptive_title') && (
                            <TableHead>Descriptive Title</TableHead>
                          )}
                          {shouldShowColumn('lec_hrs') && (
                            <TableHead className="text-center w-[80px]">Lec Hrs</TableHead>
                          )}
                          {shouldShowColumn('lab_hrs') && (
                            <TableHead className="text-center w-[80px]">Lab Hrs</TableHead>
                          )}
                          {shouldShowColumn('total_units') && (
                            <TableHead className="text-center w-[80px]">Units</TableHead>
                          )}
                          {shouldShowColumn('number_of_hours') && (
                            <TableHead className="text-center w-[80px]">Number of Hours</TableHead>
                          )}
                          {shouldShowColumn('pre_req') && (
                            <TableHead className="text-center w-[80px]">Pre Requisites</TableHead>
                          )}
                          {shouldShowColumn('year') && (
                            <TableHead className="text-center w-[80px]">
                              {programType === 'SHS' ? 'Grade' : 'Year'}
                            </TableHead>
                          )}
                          {shouldShowColumn('semester') && (
                            <TableHead className="text-center w-[80px]">Semester</TableHead>
                          )}
                          <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubjects.map((subject) => (
                          <TableRow key={subject.id}>
                            {shouldShowColumn('subject_code') && (
                              <TableCell className="font-medium">{subject.subject_code}</TableCell>
                            )}
                            {shouldShowColumn('descriptive_title') && (
                              <TableCell>{subject.descriptive_title}</TableCell>
                            )}
                            {shouldShowColumn('lec_hrs') && (
                              <TableCell className="text-center">{subject.lec_hrs}</TableCell>
                            )}
                            {shouldShowColumn('lab_hrs') && (
                              <TableCell className="text-center">{subject.lab_hrs}</TableCell>
                            )}
                            {shouldShowColumn('total_units') && (
                              <TableCell className="text-center">{subject.total_units}</TableCell>
                            )}
                            {shouldShowColumn('number_of_hours') && (
                              <TableCell className="text-center">{subject.number_of_hours}</TableCell>
                            )}
                            {shouldShowColumn('pre_req') && (
                              <TableCell className="text-center">{subject.pre_req}</TableCell>
                            )}
                            {shouldShowColumn('year') && (
                              <TableCell className="text-center">{subject.year}</TableCell>
                            )}
                            {shouldShowColumn('semester') && (
                              <TableCell className="text-center">{subject.semester}</TableCell>
                            )}
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedSubject(subject);
                                    setIsScheduleModalOpen(true);
                                  }}>
                                    <Calendar className="mr-2 h-4 w-4 group-hover:text-white" />
                                    Schedule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onEditSubject(subject)}>
                                    <Edit className="mr-2 h-4 w-4 group-hover:text-white" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDeleteSubject(subject)}>
                                    <Trash2 className="mr-2 h-4 w-4 group-hover:text-white" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                      <BookMarked className="w-8 h-8 text-[var(--dominant-red)]" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Subjects Available</h3>
                    <p className="text-gray-600 text-center max-w-md">
                      There are currently no subjects available for this course. Click the "Add Subject" button to add subjects.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-between">
                <div>
                  {subjects.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Showing {filteredSubjects.length} of {subjects.length} subjects
                      {programType && (
                        <span className="ml-2 text-gray-400">
                          • {programType} Program View
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="liquid-button"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
          {/* Schedule Modal */}
          <ScheduleModal 
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            subject={selectedSubject}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default SubjectDetailsModal;

