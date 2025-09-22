import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  ChevronDown,
  BookOpen,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// The static 'courses' array has been removed.
// The component now receives courses as a prop.

const AddSectionModal = ({ isOpen, onClose, onAddSection, courses = [] }) => {
  const [sectionName, setSectionName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sectionName.trim() && selectedCourse) {
      onAddSection({
        name: sectionName.trim(),
        course: selectedCourse
      });
      // Reset form
      setSectionName('');
      setSelectedCourse(null);
      setIsDropdownOpen(false);
      // No need to call onClose(), the parent handler will do it.
    }
  };

  const handleCancel = () => {
    // Reset form
    setSectionName('');
    setSelectedCourse(null);
    setIsDropdownOpen(false);
    onClose();
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setIsDropdownOpen(false);
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

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
        ease: [0.23, 1, 0.32, 1]
      }
    })
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
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
          >
            {/* Header */}
            <div className="gradient-soft p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[var(--dominant-red)] rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold heading-bold text-gray-900">
                      Add New Section
                    </h2>
                    <p className="text-sm text-gray-600">
                      Create a new section for students
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

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Section Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Section Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter section name..."
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="liquid-morph"
                  required
                />
              </div>

              {/* Course Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Course
                </label>
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-3 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph flex items-center justify-between"
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={selectedCourse ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedCourse ? `${selectedCourse.course_name} (${selectedCourse.course_code})` : 'Select a course...'}
                    </span>
                    <motion.div
                      animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </motion.div>
                  </motion.button>

                  {/* Dropdown Options */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
                      >
                        {courses.map((course, index) => (
                          <motion.button
                            key={course.id}
                            type="button"
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            custom={index}
                            onClick={() => handleCourseSelect(course)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                            whileHover={{ backgroundColor: 'rgba(156, 38, 44, 0.05)' }}
                          >
                            <div className="w-8 h-8 bg-[var(--dominant-red)] rounded-lg flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{course.course_name}</div>
                              <div className="text-sm text-gray-500">{course.course_code}</div>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 liquid-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-primary text-white liquid-button"
                  disabled={!sectionName.trim() || !selectedCourse}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddSectionModal;