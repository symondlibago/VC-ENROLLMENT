import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SubjectDetailsModal = ({ 
  isOpen, 
  onClose, 
  course = null
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
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
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <BookMarked className="w-8 h-8 text-[var(--dominant-red)]" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Subjects Available</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    There are currently no subjects available for this course. Please check back later or contact the administrator for more information.
                  </p>
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

export default SubjectDetailsModal;