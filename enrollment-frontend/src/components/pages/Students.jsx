import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus,
  BookOpen,
  GraduationCap,
  UserPlus,
  ChevronDown,
  MoreVertical, // Changed from MoreHorizontal
  Edit,
  Trash2 // Added Trash icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Component Imports
import SectionDetailsModal from '../modals/SectionDetailsModal';
import AddSectionModal from '../modals/AddSectionModal';
import AddStudentsToSectionModal from '../modals/AddStudentsToSectionModal';
import EditStudentModal from '../modals/EditStudentModal';
import SuccessAlert from '../modals/SuccessAlert';
import LoadingSpinner from '../layout/LoadingSpinner';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'; // Import Delete Modal
import { sectionAPI, enrollmentAPI, courseAPI, authAPI } from '@/services/api';

// Custom Framer Motion Dropdown Component (No changes)
const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(opt => opt.value === value) || { label: placeholder, value: '' }
  );

  useEffect(() => {
    setSelectedOption(options.find(opt => opt.value === value) || { label: placeholder, value: '' });
  }, [value, options, placeholder]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-2 focus:ring-[var(--dominant-red)]/20 liquid-morph flex items-center justify-between min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900">{selectedOption.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value} type="button" onClick={() => handleSelect(option)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }} whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
              >
                <span className="text-gray-900">{option.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Component
const Students = () => {
  const [activeView, setActiveView] = useState('sections');
  const [loading, setLoading] = useState(true);

  // Data states
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  
  // Alert State
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });

  // Modal states
  const [selectedSection, setSelectedSection] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isAddStudentsModalOpen, setIsAddStudentsModalOpen] = useState(false);
  const [isSectionLoading, setIsSectionLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // States for Edit and Delete functionality
  const [editingSection, setEditingSection] = useState(null);
  const [deletingSection, setDeletingSection] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionCourseFilter, setSectionCourseFilter] = useState('all');
  const [studentCourseFilter, setStudentCourseFilter] = useState('all');
  const [studentSectionFilter, setStudentSectionFilter] = useState('all');

  const currentUser = authAPI.getUserData();

  const showAlert = (message, type = 'success') => {
    setAlert({ isVisible: true, message, type });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true); 
      const [sectionsRes, coursesRes, studentsRes] = await Promise.all([
        sectionAPI.getAll(),
        courseAPI.getAll(),
        enrollmentAPI.getEnrolledStudents(),
      ]);
      
      setSections(sectionsRes.data || []);
      setCourses(coursesRes.data || []);
      setEnrolledStudents(studentsRes.data || []);
    } catch (error) {
      showAlert('Failed to load data. Please try again.', 'error');
      console.error("Data fetching error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unified handler for creating and updating sections
  const handleSectionSubmit = async (sectionData) => {
    setIsSubmitting(true);
    try {
      if (editingSection) {
        // Update logic
        const response = await sectionAPI.update(editingSection.id, { name: sectionData.name, course_id: sectionData.course.id });
        if (response.success) {
          setSections(prev => prev.map(s => s.id === editingSection.id ? response.data : s));
          showAlert('Section updated successfully!');
          setIsAddSectionModalOpen(false);
          setEditingSection(null);
        } else {
          showAlert(response.message || 'Failed to update section.', 'error');
        }
      } else {
        // Create logic
        const response = await sectionAPI.create({ name: sectionData.name, course_id: sectionData.course.id });
        if (response.success) {
          setSections(prev => [response.data, ...prev]);
          showAlert('Section added successfully!');
          setIsAddSectionModalOpen(false);
        } else {
          showAlert(response.message || 'Failed to add section.', 'error');
        }
      }
    } catch (error) {
      showAlert('An error occurred while saving the section.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler to confirm and execute deletion
  const handleConfirmDeleteSection = async () => {
    if (!deletingSection) return;
    setIsSubmitting(true);
    try {
      const response = await sectionAPI.delete(deletingSection.id);
      if (response.success) {
        setSections(prev => prev.filter(s => s.id !== deletingSection.id));
        showAlert('Section deleted successfully.');
        setIsDeleteModalOpen(false);
        setDeletingSection(null);
      } else {
        showAlert(response.message || 'Failed to delete section.', 'error');
      }
    } catch (error) {
      showAlert('An error occurred while deleting the section.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Click Handlers for Modals
  const handleAddSectionClick = () => {
    setEditingSection(null);
    setIsAddSectionModalOpen(true);
  };
  
  const handleEditSectionClick = (section) => {
    setEditingSection(section);
    setIsAddSectionModalOpen(true);
  };

  const handleDeleteSectionClick = (section) => {
    setDeletingSection(section);
    setIsDeleteModalOpen(true);
  };

  const handleRemoveStudentFromSection = async (sectionId, studentId) => {
    try {
      const response = await sectionAPI.removeStudent(sectionId, studentId);
      if (response.success) {
        const updatedSectionData = response.data;
        setSections(prevSections => 
          prevSections.map(s => (s.id === sectionId ? updatedSectionData : s))
        );
        if (selectedSection && selectedSection.id === sectionId) {
          setSelectedSection(updatedSectionData);
        }
        showAlert('Student removed successfully.');
      } else {
        throw new Error(response.message || 'API call was not successful');
      }
    } catch (error) {
      console.error("Failed to remove student from section:", error);
      showAlert(error.message || 'Failed to remove student. Please try again.', 'error');
      throw error;
    }
  };

  const handleAddStudentsToSection = async (sectionId, studentIds) => {
    try {
      const response = await sectionAPI.addStudents(sectionId, studentIds);
      if (response.success) {
        const updatedSection = response.data;
        setSections(prev => prev.map(s => s.id === sectionId ? updatedSection : s));
        setSelectedSection(updatedSection);
        showAlert('Students added successfully!');
        setIsAddStudentsModalOpen(false); 
      } else {
        showAlert(response.message || 'Failed to add students.', 'error');
      }
    } catch (error) {
      showAlert('An error occurred while adding students.', 'error');
    }
  };

  const handleSectionClick = async (section) => {
    setSelectedSection(section);
    setIsDetailsModalOpen(true);
    setIsSectionLoading(true);
    try {
      const response = await sectionAPI.getById(section.id);
      setSelectedSection(response.data.success ? response.data.data : section);
    } catch (error) {
      showAlert('An error occurred while fetching details.', 'error');
      setIsDetailsModalOpen(false);
    } finally {
      setIsSectionLoading(false);
    }
  };

  const handleEditStudent = (studentId) => {
    setSelectedStudentId(studentId);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchData(); 
  };
  
  // Memoized data for performance
  const stats = useMemo(() => [
    { title: 'Total Sections', value: sections.length.toString(), icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'Enrolled Students', value: enrolledStudents.length.toString(), icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { title: 'Total Courses', value: courses.length.toString(), icon: GraduationCap, color: 'text-[var(--dominant-red)]', bgColor: 'bg-red-50' },
    { title: 'Empty Sections', value: sections.filter(s => s.students_count === 0).length.toString(), icon: UserPlus, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  ], [sections, enrolledStudents, courses]);
  
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };

  const filteredSections = useMemo(() => sections.filter(section => {
    const courseName = section.course?.course_name || '';
    const matchesSearch = section.name.toLowerCase().includes(searchTerm.toLowerCase()) || courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = sectionCourseFilter === 'all' || section.course_id.toString() === sectionCourseFilter;
    return matchesSearch && matchesFilter;
  }), [sections, searchTerm, sectionCourseFilter]);
  
  const filteredStudents = useMemo(() => enrolledStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (student.student_id_number && student.student_id_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const courseMatch = studentCourseFilter === 'all' || student.courseId?.toString() === studentCourseFilter;
    const sectionMatch = studentSectionFilter === 'all' || 
                              (studentSectionFilter === 'unassigned' && !student.sectionId) || 
                              (student.sectionId?.toString() === studentSectionFilter);
    return matchesSearch && courseMatch && sectionMatch;
  }), [enrolledStudents, searchTerm, studentCourseFilter, studentSectionFilter]);


  if (loading) {
    return <div className="flex justify-center items-center h-full">
    <LoadingSpinner size="lg" color="red" />
    </div>;
  }

  return (
    <motion.div className="p-6 space-y-6 max-w-7xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <SuccessAlert
        isVisible={alert.isVisible}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, isVisible: false })}
      />
      
      <motion.div variants={itemVariants}>
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold heading-bold text-gray-900 flex items-center">
                <BookOpen className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Students & Sections
              </h1>
              <p className="text-gray-600">Manage student sections and view enrollment lists.</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative bg-gray-100 rounded-2xl p-1 inline-flex">
                  <motion.div
                    className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md"
                    initial={false}
                    animate={{ left: activeView === 'sections' ? '4px' : '50%', right: activeView === 'sections' ? '50%' : '4px' }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                  />
                  <motion.button
                    onClick={() => setActiveView('sections')}
                    className={`relative z-10 p-3 rounded-xl transition-colors duration-300 ${activeView === 'sections' ? 'text-[var(--dominant-red)]' : 'text-gray-600 hover:text-gray-800'}`}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Sections"
                  > <BookOpen className="w-5 h-5" /> </motion.button>
                  <motion.button
                    onClick={() => setActiveView('students')}
                    className={`relative z-10 p-3 rounded-xl transition-colors duration-300 ${activeView === 'students' ? 'text-[var(--dominant-red)]' : 'text-gray-600 hover:text-gray-800'}`}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} title="Students"
                  > <Users className="w-5 h-5" /> </motion.button>
              </div>
              <Button className="gradient-primary text-white" onClick={handleAddSectionClick}>
                <Plus className="w-4 h-4 mr-2" />Add Section
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => {
          const Icon = stat.icon;
          return <Card key={stat.title}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold heading-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>;
        })}
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div key={activeView} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
          {activeView === 'sections' 
            ? <SectionPage 
                sections={filteredSections} courses={courses} searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                courseFilter={sectionCourseFilter} setCourseFilter={setSectionCourseFilter} onSectionClick={handleSectionClick}
                onAddSectionClick={handleAddSectionClick}
                onEditClick={handleEditSectionClick}
                onDeleteClick={handleDeleteSectionClick}
              />
            : <StudentPage 
                students={filteredStudents} sections={sections} courses={courses} searchTerm={searchTerm}
                setSearchTerm={setSearchTerm} courseFilter={studentCourseFilter} setCourseFilter={setStudentCourseFilter}
                sectionFilter={studentSectionFilter} setSectionFilter={setStudentSectionFilter}
                onEditStudent={handleEditStudent} currentUser={currentUser} 
              />
          }
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <SectionDetailsModal 
        isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} section={selectedSection} 
        isLoading={isSectionLoading} onOpenAddStudents={() => setIsAddStudentsModalOpen(true)}
        onStudentRemoved={handleRemoveStudentFromSection}
      />
      <AddSectionModal 
        isOpen={isAddSectionModalOpen} 
        onClose={() => { setIsAddSectionModalOpen(false); setEditingSection(null); }} 
        onSubmit={handleSectionSubmit} 
        courses={courses} 
        sectionToEdit={editingSection}
      />
      <AddStudentsToSectionModal
        isOpen={isAddStudentsModalOpen} onClose={() => setIsAddStudentsModalOpen(false)} section={selectedSection}
        allStudents={enrolledStudents} enrolledStudentIds={selectedSection?.students?.map(s => s.id) || []}
        onAddStudents={(studentIds) => handleAddStudentsToSection(selectedSection.id, studentIds)}
      />
      {isEditModalOpen && (
        <EditStudentModal
          isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
          studentId={selectedStudentId} onUpdateSuccess={handleUpdateSuccess}
        />
      )}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteSection}
        title="Delete Section"
        message="Are you sure you want to delete this section? All student assignments will be removed. This action cannot be undone."
        itemName={deletingSection?.name}
        isLoading={isSubmitting}
      />
    </motion.div>
  );
};

// Sub-component for Sections View
const SectionPage = ({ sections, courses, searchTerm, setSearchTerm, courseFilter, setCourseFilter, onSectionClick, onAddSectionClick, onEditClick, onDeleteClick }) => {
    const courseOptions = useMemo(() => [
      { label: 'Filter by All Courses', value: 'all' },
      ...courses.map(course => ({ label: course.course_code, value: course.id.toString() }))
    ], [courses]);
  
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search sections by name or course..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-1 border-gray-200 focus:ring-red-800 focus:border-red-800"/>
                </div>
              </div>
              <div className="relative w-full md:w-auto">
                <MotionDropdown value={courseFilter} onChange={setCourseFilter} options={courseOptions} placeholder="Filter by All Courses"/>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <motion.div 
              key={section.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.05 }}} 
              whileHover={{ y: -5 }} 
              className="relative"
            >
              <div onClick={() => onSectionClick(section)} className="cursor-pointer h-full">
                <Card className="h-full flex flex-col">
                    <CardContent className="p-6 flex-grow flex flex-col justify-between">
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-[var(--dominant-red)] rounded-xl flex items-center justify-center shrink-0"><BookOpen className="w-6 h-6 text-white" /></div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{section.name}</h3>
                                        <Badge className={`text-xs mt-1 ${section.students.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{section.students.length} student{section.students.length !== 1 ? 's' : ''}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-600"><GraduationCap className="w-4 h-4 mr-2 text-gray-400" /><span className="truncate">{section.course?.course_name || 'N/A'}</span></div>
                                <div className="flex items-center text-sm text-gray-600"><Users className="w-4 h-4 mr-2 text-gray-400" /><span>{section.course?.program?.program_code || 'No Program'}</span></div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Click to view students</span></div></div>
                    </CardContent>
                </Card>
              </div>

              {/* Dropdown Menu for Edit/Delete */}
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0" // <-- CHANGE IS HERE: Removed opacity classes
                      onClick={(e) => e.stopPropagation()} // Prevent card click
                    >
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => onEditClick(section)}>
                      <Edit className="w-4 h-4 mr-2 hover:text-white" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => onDeleteClick(section)}>
                      <Trash2 className="w-4 h-4 mr-2 hover:text-white" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
        {sections.length === 0 && <div className="text-center py-12"><BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900 mb-2">No sections found</h3><p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p><Button className="gradient-primary text-white" onClick={onAddSectionClick}><Plus className="w-4 h-4 mr-2" />Add First Section</Button></div>}
      </div>
    );
};


// Sub-component for Students View
const StudentPage = ({ students, sections, courses, searchTerm, setSearchTerm, courseFilter, setCourseFilter, sectionFilter, setSectionFilter, onEditStudent, currentUser }) => {
    const courseOptions = useMemo(() => [
      { label: 'Filter by All Courses', value: 'all' },
      ...courses.map(course => ({ label: course.course_code, value: course.id.toString() }))
    ], [courses]);
  
    const sectionOptions = useMemo(() => [
      { label: 'Filter by All Sections', value: 'all' },
      { label: 'Filter by Unassigned', value: 'unassigned' },
      ...sections.map(section => ({ label: section.name, value: section.id.toString() }))
    ], [sections]);
    
    const canEdit = currentUser.role === 'Admin' || currentUser.role === 'Registrar';
  
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search students by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 border-1 border-gray-300 focus:border-red-800 focus:ring-1 focus:ring-red-800 rounded-lg"/>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full sm:w-auto">
                  <MotionDropdown value={courseFilter} onChange={setCourseFilter} options={courseOptions} placeholder="Filter by All Courses"/>
                </div>
                <div className="relative w-full sm:w-auto">
                  <MotionDropdown value={sectionFilter} onChange={setSectionFilter} options={sectionOptions} placeholder="Filter by All Sections"/>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? students.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.student_id_number}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.courseName}</TableCell>
                  <TableCell>
                    <Badge variant={student.sectionName === 'Unassigned' ? "destructive" : "secondary"}>
                      {student.sectionName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEditStudent(student.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Student
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan="5" className="text-center h-24">No students found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    );
}

export default Students;