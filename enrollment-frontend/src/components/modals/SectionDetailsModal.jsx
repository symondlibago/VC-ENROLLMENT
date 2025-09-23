import React from 'react'; // MODIFIED: Removed useState
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  UserPlus,
  MoreVertical,
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
import LoadingSpinner from '../layout/LoadingSpinner';

// MODIFIED: Simplified props
const SectionDetailsModal = ({ isOpen, onClose, section, isLoading, onOpenAddStudents }) => {
  const sectionStudents = section?.students || [];

  // ... getStatusColor function remains the same ...
  const getStatusColor = (status) => {
    switch (status) {
      case 'enrolled':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" color="red" />
        </div>
      );
    }

    if (sectionStudents.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students enrolled</h3>
            <p className="text-gray-500 mb-4">This section doesn't have any students yet.</p>
            {/* MODIFIED: Uses the prop function to open the modal */}
            <Button onClick={onOpenAddStudents} className="gradient-primary text-white liquid-button">
              <UserPlus className="w-4 h-4 mr-2" />
              Add First Student
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto p-6">
        {/* ... Table rendering remains the same ... */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-900">ID No.</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-900">Name</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-900">Course Code</th>
                <th className="text-left py-4 px-4 font-semibold text-gray-900">Contact</th>
                <th className="text-center py-4 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sectionStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="py-4 px-4">
                    <span className="font-mono text-sm text-gray-600">
                      #{student.student_id_number || student.id.toString().padStart(4, '0')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`/api/placeholder/40/40`} alt={student.name} />
                        <AvatarFallback className="bg-[var(--dominant-red)] text-white font-bold text-sm">
                          {student.avatar || (student.first_name?.charAt(0) + student.last_name?.charAt(0))}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{student.last_name}, {student.first_name} {student.middle_name?.charAt(0)+"."}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="outline" className="font-mono">
                      {student.courseCode || section?.course?.course_code}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[150px]">{student.email_address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-3 h-3 mr-1" />
                        <span>{student.contact_number || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="liquid-button h-10 w-10 rounded-full cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4 " />
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
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
            className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 h-[80vh] flex flex-col"
          >
            <div className="gradient-soft p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  {/* MODIFIED: This now correctly displays the name immediately */}
                  <h2 className="text-2xl font-bold heading-bold text-gray-900">
                    {section?.name || 'Loading Section...'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {isLoading ? 'Loading students...' : `${sectionStudents.length} student${sectionStudents.length !== 1 ? 's' : ''} enrolled`}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* MODIFIED: Uses the prop function */}
                  <Button onClick={onOpenAddStudents} className="gradient-primary text-white liquid-button cursor-pointer" disabled={isLoading}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Insert Student
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SectionDetailsModal;