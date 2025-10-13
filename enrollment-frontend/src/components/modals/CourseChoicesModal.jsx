import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Search, GraduationCap, ChevronDown } from 'lucide-react';
import { courseAPI, programAPI } from '@/services/api';
import { Button } from '@/components/ui/button';


const CourseChoicesModal = ({
  isOpen,
  onClose,
  onSelectCourse
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('All');
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [allPrograms, setAllPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedProgram("All");
      const fetchCoursesAndPrograms = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [coursesData, programsData] = await Promise.all([
            courseAPI.getAll(),
            programAPI.getAll(),
          ]);

          setAllCourses(coursesData.data || []);
          setAllPrograms(programsData.data || []);
        } catch (err) {
          setError(err.message || 'Failed to fetch data');
          console.error('Error fetching data:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCoursesAndPrograms();
    }
  }, [isOpen]);

  // Group courses by program
  const groupedCourses = allCourses.reduce((acc, course) => {
    const programCode = course.program?.program_code || 'Unknown';
    if (!acc[programCode]) {
      acc[programCode] = [];
    }
    acc[programCode].push(course);
    return acc;
  }, {});

  // Filter courses based on search term and selected program
  const filteredGroupedCourses = Object.keys(groupedCourses).reduce((acc, programCode) => {
    if (selectedProgram !== 'All' && programCode !== selectedProgram) {
      return acc;
    }

    const filteredCourses = groupedCourses[programCode].filter(course =>
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredCourses.length > 0) {
      acc[programCode] = filteredCourses;
    }

    return acc;
  }, {});

  const handleCourseSelect = (course) => {
    onSelectCourse(course);
    onClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Get program display name
  const getProgramDisplayName = (programCode) => {
    switch (programCode) {
      case 'Bachelor':
        return 'Bachelor Program';
      case 'Diploma':
        return 'Diploma Program';
      case 'SHS':
        return 'Senior High School Program';
      default:
        return programCode;
    }
  };

  // Get program icon
  const getProgramIcon = (programCode) => {
    switch (programCode) {
      case 'Bachelor':
        return <GraduationCap className="w-5 h-5 text-blue-600" />;
      case 'Diploma':
        return <BookOpen className="w-5 h-5 text-green-600" />;
      case 'SHS':
        return <BookOpen className="w-5 h-5 text-purple-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-600" />;
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

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-800">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <BookOpen className="w-6 h-6 mr-3" />
                Select Department
              </h2>
              <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading} className="text-white hover:text-red-800 hover:bg-white cursor-pointer">
                  <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Search and Filter Section */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)] text-sm"
                  />
                </div>

                {/* Program Filter */}
                {/* Program Filter Custom Dropdown */}
                <div className="md:w-48 relative">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--dominant-red)] focus:border-[var(--dominant-red)] text-sm flex justify-between items-center"
                    onClick={() => setIsProgramDropdownOpen(!isProgramDropdownOpen)}
                  >
                    {selectedProgram === 'All' ? 'All Programs' : allPrograms.find(p => p.program_code === selectedProgram)?.program_name || 'Select Program'}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProgramDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </button>
                  <AnimatePresence>
                    {isProgramDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
                      >
                        <div
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            setSelectedProgram('All');
                            setIsProgramDropdownOpen(false);
                          }}
                        >
                          All Programs
                        </div>
                        {allPrograms.map((program) => (
                          <div
                            key={program.program_code}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSelectedProgram(program.program_code);
                              setIsProgramDropdownOpen(false);
                            }}
                          >
                            {program.program_name}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--dominant-red)]"></div>
                  <span className="ml-3 text-gray-600">Loading courses...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">
                    <BookOpen className="w-12 h-12 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold">Error Loading Courses</h3>
                    <p className="text-sm">{error}</p>
                  </div>
                  <button
                    onClick={() => {
                      setError(null);
                      // Trigger refetch
                      const fetchCoursesAndPrograms = async () => {
                        setIsLoading(true);
                        setError(null);
                        try {
                          const [coursesData, programsData] = await Promise.all([
                            courseAPI.getAll(),
                            programAPI.getAll(),
                          ]);
                          setAllCourses(coursesData.data || []);
                          setAllPrograms(programsData.data || []);
                        } catch (err) {
                          setError(err.message || 'Failed to fetch data');
                          console.error('Error fetching data:', err);
                        } finally {
                          setIsLoading(false);
                        }
                      };
                      fetchCoursesAndPrograms();
                    }}
                    className="bg-[var(--dominant-red)] text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : Object.keys(filteredGroupedCourses).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(filteredGroupedCourses).map(([programCode, programCourses]) => (
                    <motion.div
                      key={programCode}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Program Header */}
                      <div className="bg-red-800 p-4 border-b border-gray-200">
                        <div className="flex items-center">
                          {getProgramIcon(programCode)}
                          <h3 className="text-lg font-bold text-white ml-3">
                            {getProgramDisplayName(programCode)}
                          </h3>
                          <span className="ml-auto text-sm text-white">
                            {programCourses.length} course{programCourses.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Courses List */}
                      <div className="divide-y divide-gray-100">
                        {programCourses.map((course) => (
                          <motion.button
                            key={course.id}
                            onClick={() => handleCourseSelect(course)}
                            className="w-full p-4 text-left hover:bg-gradient-to-r hover:from-[var(--whitish-pink)] hover:to-white transition-all duration-200 focus:outline-none focus:bg-gradient-to-r focus:from-[var(--whitish-pink)] focus:to-white"
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <span className="text-sm font-bold text-[var(--dominant-red)] bg-red-50 px-2 py-1 rounded">
                                    {course.course_code}
                                  </span>
                                </div>
                                <h4 className="text-base font-semibold text-gray-900 mb-1">
                                  {course.course_name}
                                </h4>
                                {course.course_specialization && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    Specialization: {course.course_specialization}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {course.description}
                                </p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <span>Duration: {course.years} year{course.years !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedProgram !== 'All' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No courses are available at the moment.'
                    }
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CourseChoicesModal;

