import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddStudentsToSectionModal from './AddStudentsToSectionModal';

const SectionDetailsModal = ({ isOpen, onClose, section, students, allStudents, onAddStudentsToSection }) => {
  const [isAddStudentsModalOpen, setIsAddStudentsModalOpen] = useState(false);

  if (!section) return null;

  const sectionStudents = students.filter(student => 
    section.studentIds.includes(student.id)
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

  const handleInsertStudentClick = () => {
    setIsAddStudentsModalOpen(true);
  };

  const handleCloseAddStudentsModal = () => {
    setIsAddStudentsModalOpen(false);
  };

  const handleAddStudents = (selectedStudentIds) => {
    onAddStudentsToSection(section.id, selectedStudentIds);
    setIsAddStudentsModalOpen(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="gradient-soft p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold heading-bold text-gray-900">
                    {section.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {sectionStudents.length} student{sectionStudents.length !== 1 ? 's' : ''} enrolled
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleInsertStudentClick}
                    className="gradient-primary text-white liquid-button"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Insert Student
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="liquid-button hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {sectionStudents.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
                    <p className="text-gray-500 mb-4">This section doesn't have any students yet.</p>
                    <Button
                      onClick={handleInsertStudentClick}
                      className="gradient-primary text-white liquid-button"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add First Student
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">ID No.</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Name</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Course Code</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Status</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">Contact</th>
                          <th className="text-left py-4 px-4 font-semibold text-gray-900">GPA</th>
                          <th className="text-center py-4 px-4 font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionStudents.map((student, index) => (
                          <motion.tr
                            key={student.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ 
                              opacity: 1, 
                              y: 0,
                              transition: {
                                duration: 0.4,
                                delay: index * 0.1,
                                ease: [0.23, 1, 0.32, 1]
                              }
                            }}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                          >
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
                              <div className="space-y-1">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="w-3 h-3 mr-1" />
                                  <span className="truncate max-w-[150px]">{student.email}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-3 h-3 mr-1" />
                                  <span>{student.phone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-[var(--dominant-red)]">
                                {student.gpa}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="liquid-button">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Student
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove from Section
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
          </motion.div>

          {/* Add Students Modal */}
          <AddStudentsToSectionModal
            isOpen={isAddStudentsModalOpen}
            onClose={handleCloseAddStudentsModal}
            section={section}
            allStudents={allStudents}
            enrolledStudentIds={section.studentIds}
            onAddStudents={handleAddStudents}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default SectionDetailsModal;

