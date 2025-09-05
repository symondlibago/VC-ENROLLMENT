import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ProgramDetailsModal = ({ 
  isOpen, 
  onClose, 
  program = null,
  courses = []
}) => {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  // Filter courses that belong to this program
  const programCourses = courses.filter(course => 
    program && course.program_id === program.id
  );

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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold heading-bold text-gray-900 flex items-center">
                  <BookOpen className="w-6 h-6 text-[var(--dominant-red)] mr-3" />
                  {program ? program.program_name : 'Program Details'}
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
                {program && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Program Description</h3>
                    <p className="text-gray-600">{program.description}</p>
                    <div className="mt-4 flex items-center">
                      <Badge className="bg-blue-100 text-blue-800">
                        {program.years} years
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Courses in this Program</h3>
                  
                  {programCourses.length > 0 ? (
                    <div className="space-y-4">
                      {programCourses.map((course) => (
                        <motion.div 
                          key={course.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          className="p-4 border border-gray-100 rounded-xl hover:border-[var(--dominant-red)] hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">{course.course_name}</h4>
                              <p className="text-sm text-gray-500 mt-1">{course.course_specialization}</p>
                              <p className="text-sm text-gray-600 mt-2">{course.description}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="liquid-button"
                              onClick={() => {
                                // This would be replaced with actual subject viewing logic
                                alert('No subjects available for this course yet.');
                              }}
                            >
                              View Subjects
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No courses found for this program.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-end">
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
        </>
      )}
    </AnimatePresence>
  );
};

export default ProgramDetailsModal;