import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  UserPlus,
  Search,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const AddStudentsToSectionModal = ({ isOpen, onClose, section, allStudents, enrolledStudentIds, onAddStudents }) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  if (!section || !allStudents) return null;

  // Filter out students already enrolled in this section
  const availableStudents = allStudents.filter(student => 
    !enrolledStudentIds.includes(student.id)
  );

  // Filter students based on search term
  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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

  const handleSubmit = () => {
    if (selectedStudentIds.length > 0) {
      onAddStudents(selectedStudentIds);
      setSelectedStudentIds([]);
      setSearchTerm('');
    }
  };

  const handleCancel = () => {
    setSelectedStudentIds([]);
    setSearchTerm('');
    onClose();
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
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
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 h-[80vh] flex flex-col"
          >
            {/* Header */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="liquid-button hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students by name, email, or course code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 liquid-morph"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  className="liquid-button"
                  disabled={filteredStudents.length === 0}
                >
                  {selectedStudentIds.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {filteredStudents.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {availableStudents.length === 0 ? 'All students are enrolled' : 'No students found'}
                    </h3>
                    <p className="text-gray-500">
                      {availableStudents.length === 0 
                        ? 'All available students are already enrolled in this section.'
                        : 'Try adjusting your search criteria.'
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
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">ID No.</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Name</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Course Code</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Status</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">GPA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, index) => (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              transition: {
                                duration: 0.4,
                                delay: index * 0.05,
                                ease: [0.23, 1, 0.32, 1]
                              }
                            }}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                              selectedStudentIds.includes(student.id) ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleStudentToggle(student.id)}
                          >
                            <td className="py-4 px-4">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(student.id)}
                                  onChange={() => handleStudentToggle(student.id)}
                                  className="w-4 h-4 text-[var(--dominant-red)] border-gray-300 rounded focus:ring-[var(--dominant-red)]"
                                />
                                {selectedStudentIds.includes(student.id) && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                  >
                                    <Check className="w-3 h-3 text-white" />
                                  </motion.div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-mono text-sm text-gray-600">
                                #{student.id.toString().padStart(4, '0')}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={`/api/placeholder/40/40`} alt={student.name} />
                                  <AvatarFallback className="bg-[var(--dominant-red)] text-white font-bold text-sm">
                                    {student.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-gray-900">{student.name}</div>
                                  <div className="text-sm text-gray-500">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline" className="font-mono">
                                {student.courseCode}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={`${getStatusColor(student.status)} text-xs`}>
                                {student.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-[var(--dominant-red)]">
                                {student.gpa}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="liquid-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedStudentIds.length === 0}
                    className="gradient-primary text-white liquid-button"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add {selectedStudentIds.length} Student{selectedStudentIds.length !== 1 ? 's' : ''}
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

