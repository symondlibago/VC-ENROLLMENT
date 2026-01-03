import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  UserPlus,
  Search,
  Loader2,
  ChevronDown,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const AddStudentsToSectionModal = ({ isOpen, onClose, section, allStudents, enrolledStudentIds, onAddStudents }) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState('All');

  // Academic year options based on the model's structure
  const yearLevels = [
    'All',
    'Grade 11',
    'Grade 12',
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    '1st Year Summer',
    '2nd Year Summer'
  ];

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10, pointerEvents: 'none' },
    visible: { opacity: 1, scale: 1, y: 0, pointerEvents: 'auto', transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedStudentIds([]);
      setSearchTerm('');
      setYearFilter('All');
    }
  }, [isOpen]);
  
  const availableStudents = useMemo(() => {
    const currentEnrolledIds = enrolledStudentIds || [];
    if (!allStudents) return [];
    return allStudents.filter(student => 
      !currentEnrolledIds.includes(student.id) && student.courseId === section?.course_id
    );
  }, [allStudents, enrolledStudentIds, section]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    return availableStudents.filter(student => {
      // Search matching logic
      const matchesSearch = !term || 
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        (student.student_id_number && student.student_id_number.toLowerCase().includes(term));

      // Year matching logic (student.year property from the PreEnrolledStudent model)
      const matchesYear = yearFilter === 'All' || student.year === yearFilter;

      return matchesSearch && matchesYear;
    });
  }, [availableStudents, searchTerm, yearFilter]);

  if (!section || !allStudents) return null;

  const handleStudentToggle = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(student => student.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onAddStudents(selectedStudentIds);
    } catch (error) {
      console.error("Failed to add students:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
    exit: { opacity: 0, scale: 0.8, y: 50, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 h-[80vh] flex flex-col"
          >
            <div className="gradient-soft p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--dominant-red)] rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold heading-bold text-gray-900">
                      Add Students to {section.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Select students to add to this section ({selectedStudentIds.length} selected)
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Smooth Year Filter Dropdown */}
                <div className="relative min-w-[180px]">
  {/* Trigger Button */}
  <button
    onClick={() => setIsDropdownOpen(!isDropdownOpen)} // You'll need: const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-md py-2 px-3 text-sm hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] transition-all"
  >
    <span className="truncate">{yearFilter}</span>
    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
  </button>

  {/* Motion Dropdown Menu */}
  <AnimatePresence>
    {isDropdownOpen && (
      <>
        {/* Invisible backdrop to close dropdown when clicking outside */}
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsDropdownOpen(false)} 
        />
        <motion.div
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl py-1 overflow-hidden"
        >
          {yearLevels.map((year) => (
            <button
              key={year}
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              onClick={() => {
                setYearFilter(year);
                setIsDropdownOpen(false);
              }}
            >
              <span className={yearFilter === year ? "font-semibold text-[var(--dominant-red)]" : "text-gray-700"}>
                {year}
              </span>
              {yearFilter === year && <Check className="w-4 h-4 text-[var(--dominant-red)]" />}
            </button>
          ))}
        </motion.div>
      </>
    )}
  </AnimatePresence>
</div>

                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={filteredStudents.length === 0}
                >
                  {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {filteredStudents.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {availableStudents.length === 0 ? 'No available students' : 'No students found'}
                    </h3>
                    <p className="text-gray-500">
                      {availableStudents.length === 0 
                        ? 'All students for this course are already in a section.'
                        : 'Try adjusting your search or year filter.'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-4 font-semibold text-gray-900 w-12">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                              onChange={handleSelectAll}
                              className="w-4 h-4 text-[var(--dominant-red)] border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                            />
                          </th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Student ID</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Name</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Course</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, index) => (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                              selectedStudentIds.includes(student.id) ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleStudentToggle(student.id)}
                          >
                            <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="relative flex items-center justify-center h-full">
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(student.id)}
                                  onChange={() => handleStudentToggle(student.id)}
                                  className="w-4 h-4 text-[var(--dominant-red)] border-gray-300 rounded focus:ring-[var(--dominant-red)] cursor-pointer"
                                />
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-mono text-sm text-gray-600">
                                {student.student_id_number}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={`/api/placeholder/40/40`} alt={student.name} />
                                  <AvatarFallback className="bg-[var(--dominant-red)] text-white font-bold text-sm">
                                    {student.name.split(',')[0].charAt(0)}{student.name.split(',')[1]?.trim().charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">{student.name}</div>
                                  <div className="text-sm text-gray-500">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col space-y-1">
                                <Badge variant="outline" className="font-mono w-fit">
                                  {student.courseName}
                                </Badge>
                                <span className="text-xs text-gray-400 pl-1">{student.year}</span>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedStudentIds.length === 0 || isSubmitting}
                    className="gradient-primary text-white min-w-[180px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Students...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add {selectedStudentIds.length} Student{selectedStudentIds.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddStudentsToSectionModal;