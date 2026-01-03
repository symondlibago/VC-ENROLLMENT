import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subjectAPI } from '@/services/api';
import LoadingSpinner from '../layout/LoadingSpinner';

const ViewStudentsModal = ({ isOpen, onClose, subject }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch if the modal is actually open and we have a subject ID
    if (isOpen && subject?.id) {
      const fetchStudents = async () => {
        setLoading(true);
        try {
          const response = await subjectAPI.getEnrolledStudents(subject.id);
          if (response.success) {
            // Note: Data is mapped to ensure consistency with the table fields below
            setStudents(response.data);
          }
        } catch (error) {
          console.error("Error fetching students:", error);
          setStudents([]);
        } finally {
          setLoading(false);
        }
      };
      fetchStudents();
    }
  }, [isOpen, subject]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b bg-red-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">Enrolled Students</h2>
                <p className="text-sm text-white">{subject?.subject_code} - {subject?.descriptive_title}</p>
              </div>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:text-red-800 hover:bg-white hover:white cursor-pointer text-white"
              >
                <X className="w-5 h-5" />
              </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner />
                <p className="mt-4 text-gray-500">Loading student list...</p>
              </div>
            ) : students.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student ID</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Full Name</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Course & Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-sm text-red-600">
                          {student.student_id || student.student_id_number}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {student.name ? student.name.toUpperCase() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.course} - {student.year || student.year_level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-medium">No Students Found</h3>
                <p className="text-gray-500 mt-1 italic">There are no students currently enrolled in this subject.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ViewStudentsModal;