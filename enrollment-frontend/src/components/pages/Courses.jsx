import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Clock,
  Users,
  Edit,
  Trash2,
  Download,
  Play,
  BookMarked,
  Award,
  GraduationCap,
  School,
  Building,
} from 'lucide-react';
import { courseAPI, programAPI, subjectAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CourseModal from '../modals/CourseModal';
import ProgramModal from '../modals/ProgramModal';
import ProgramDetailsModal from '../modals/ProgramDetailsModal';
import SubjectDetailsModal from '../modals/SubjectDetailsModal';
import SubjectModal from '../modals/SubjectModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import SuccessAlert from '../modals/SuccessAlert';
import DownloadStudents from '../layout/DownloadStudents'; // Adjust path based on where you saved it

const Courses = () => {
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('1st Year');
  const [selectedSemester, setSelectedSemester] = useState('1st Semester');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'programs'
  
  // Data State
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [isProgramDetailsModalOpen, setIsProgramDetailsModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isSubjectFormModalOpen, setIsSubjectFormModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  const [alert, setAlert] = useState({
    isVisible: false,
    message: '',
    type: 'success' // 'success', 'error', 'warning'
  });

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const response = await courseAPI.getAll();
        if (response.success) {
          setCourses(response.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setAlert({
          isVisible: true,
          message: 'Failed to load courses. Please try again later.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoading(true);
      try {
        const response = await programAPI.getAll();
        if (response.success) {
          setPrograms(response.data);
        }
      } catch (error) {
        console.error('Error fetching programs:', error);
        setAlert({
          isVisible: true,
          message: 'Failed to load programs. Please try again later.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrograms();
  }, []);

  // Helper function to get program type for a course
  const getProgramTypeForCourse = (course) => {
    if (!course || !programs) return null;
    const program = programs.find(p => p.id === course.program_id);
    return program ? program.program_code : null;
  };

  const stats = useMemo(() => ([
    {
      title: 'Total Courses',
      value: courses.length.toString(),
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Courses',
      value: courses.length.toString(),
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Students',
      value: '2,847', // This data is not available in this component
      icon: Users,
      color: 'text-[var(--dominant-red)]',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Avg Rating',
      value: '4.7', // This data is not available in this component
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]), [courses]);

  const programStats = useMemo(() => ([
    {
      title: 'Total Programs',
      value: programs.length.toString(),
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Senior High Programs',
      value: programs.filter(p => p.program_code === 'SHS').length.toString(),
      icon: School,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Diploma Programs',
      value: programs.filter(p => p.program_code === 'Diploma').length.toString(),
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Bachelor Programs',
      value: programs.filter(p => p.program_code === 'Bachelor').length.toString(),
      icon: Building,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ]), [programs]);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Mathematics':
        return 'bg-purple-100 text-purple-800';
      case 'Technology':
        return 'bg-blue-100 text-blue-800';
      case 'Business':
        return 'bg-green-100 text-green-800';
      case 'Data Science':
        return 'bg-orange-100 text-orange-800';
      case 'Arts':
        return 'bg-pink-100 text-pink-800';
      case 'Senior High School':
        return 'bg-cyan-100 text-cyan-800';
      case 'Diploma':
        return 'bg-amber-100 text-amber-800';
      case 'Bachelor\'s Degree':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentData = () => {
    return activeTab === 'courses' ? courses : programs;
  };

  const getCurrentStats = () => {
    return activeTab === 'courses' ? stats : programStats;
  };

  const currentData = getCurrentData() || [];
  
  const filteredData = currentData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.course_name && item.course_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.course_code && item.course_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.program_name && item.program_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ((item.instructor || item.coordinator || "").toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = selectedFilter === 'all' || item.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Modal functions for courses
  const openCourseModal = (course = null) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
    setSelectedYear('1st Year');
    setSelectedSemester('1st Semester');
    setIsYearDropdownOpen(false);
    setIsSemesterDropdownOpen(false);
  };

  const closeCourseModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };
  
  // Handle course creation and update
  const handleCourseSubmit = async (courseData) => {
    setIsLoading(true);
    try {
      let response;
      
      if (selectedCourse) {
        response = await courseAPI.update(selectedCourse.id, courseData);
        if (response.success) {
          setCourses(prevCourses => 
            prevCourses.map(course => 
              course.id === selectedCourse.id ? response.data : course
            )
          );
          setAlert({
            isVisible: true,
            message: 'Course updated successfully!',
            type: 'success'
          });
        }
      } else {
        response = await courseAPI.create(courseData);
        if (response.success) {
          setCourses(prevCourses => [...prevCourses, response.data]);
          setAlert({
            isVisible: true,
            message: 'Course created successfully!',
            type: 'success'
          });
        }
      }
      
      closeCourseModal();
    } catch (error) {
      console.error('Error saving course:', error);
      setAlert({
        isVisible: true,
        message: `Failed to ${selectedCourse ? 'update' : 'create'} course. ${error.message || 'Please try again.'}`,
        type: 'error'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle program creation and update
  const handleProgramSubmit = async (programData) => {
    setIsLoading(true);
    try {
      let response;
      
      if (selectedProgram) {
        response = await programAPI.update(selectedProgram.id, programData);
        if (response.success) {
          setPrograms(prevPrograms => 
            prevPrograms.map(program => 
              program.id === selectedProgram.id ? response.data : program
            )
          );
          setAlert({
            isVisible: true,
            message: 'Program updated successfully!',
            type: 'success'
          });
        }
      } else {
        response = await programAPI.create(programData);
        if (response.success) {
          setPrograms(prevPrograms => [...prevPrograms, response.data]);
          setAlert({
            isVisible: true,
            message: 'Program created successfully!',
            type: 'success'
          });
        }
      }
      
      setIsProgramModalOpen(false);
      setSelectedProgram(null);
    } catch (error) {
      console.error('Error saving program:', error);
      setAlert({
        isVisible: true,
        message: `Failed to ${selectedProgram ? 'update' : 'create'} program. ${error.message || 'Please try again.'}`,
        type: 'error'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle subject creation and update
  const handleSubjectSubmit = async (subjectData) => {
    setIsLoading(true);
    try {
      let response;
      
      if (selectedSubject) {
        response = await subjectAPI.update(selectedSubject.id, subjectData);
        if (response.success) {
          setAlert({
            isVisible: true,
            message: 'Subject updated successfully!',
            type: 'success'
          });
          
          if (isSubjectModalOpen && selectedCourse) {
            const updatedCourse = await courseAPI.getById(selectedCourse.id);
            if (updatedCourse.success) {
              setSelectedCourse(updatedCourse.data);
            }
          }
        }
      } else {
        response = await subjectAPI.create({
          ...subjectData,
          course_id: selectedCourse.id
        });
        if (response.success) {
          setAlert({
            isVisible: true,
            message: 'Subject created successfully!',
            type: 'success'
          });
          
          if (isSubjectModalOpen && selectedCourse) {
            const updatedCourse = await courseAPI.getById(selectedCourse.id);
            if (updatedCourse.success) {
              setSelectedCourse(updatedCourse.data);
            }
          }
        }
      }
      
      setIsSubjectFormModalOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Error saving subject:', error);
      setAlert({
        isVisible: true,
        message: `Failed to ${selectedSubject ? 'update' : 'create'} subject. ${error.message || 'Please try again.'}`,
        type: 'error'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle deletion of courses and programs
  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    
    setIsLoading(true);
    try {
      let response;
      
      if (selectedItem.subject_code) {
        response = await subjectAPI.delete(selectedItem.id);
        if (response.success) {
          setAlert({
            isVisible: true,
            message: 'Subject deleted successfully!',
            type: 'success'
          });
          if (isSubjectModalOpen && selectedCourse) {
            const updatedCourseResponse = await courseAPI.getById(selectedCourse.id);
            if (updatedCourseResponse.success) {
              setSelectedCourse(updatedCourseResponse.data);
            }
          }
        }
      } else if (activeTab === 'courses') {
        response = await courseAPI.delete(selectedItem.id);
        if (response.success) {
          setCourses(prevCourses => prevCourses.filter(course => course.id !== selectedItem.id));
          setAlert({
            isVisible: true,
            message: 'Course deleted successfully!',
            type: 'success'
          });
        }
      } else if (activeTab === 'programs') {
        response = await programAPI.delete(selectedItem.id);
        if (response.success) {
          setPrograms(prevPrograms => prevPrograms.filter(program => program.id !== selectedItem.id));
          setAlert({
            isVisible: true,
            message: 'Program deleted successfully!',
            type: 'success'
          });
        }
      }
      
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error(`Error deleting item:`, error);
      setAlert({
        isVisible: true,
        message: `Failed to delete item. ${error.message || 'Please try again.'}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="animate-fade-in">
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2 flex items-center">
                {activeTab === 'courses' ? (
                  <BookOpen className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                ) : (
                  <GraduationCap className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                )}
                {activeTab === 'courses' ? 'Courses Management' : 'Programs Management'}
              </h1>
              <p className="text-gray-600 text-lg">
                {activeTab === 'courses' 
                  ? 'Create, manage, and monitor all educational courses and programs.'
                  : 'Manage academic programs including Senior High School, Diploma, and Bachelor\'s degree programs.'
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative bg-gray-100 rounded-2xl p-1 inline-flex">
                <motion.div
                  className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md"
                  initial={false}
                  animate={{
                    left: activeTab === 'courses' ? '4px' : '50%',
                    right: activeTab === 'courses' ? '50%' : '4px',
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                  }}
                />
                <motion.button
                  onClick={() => setActiveTab('courses')}
                  className={`relative z-10 p-3 rounded-xl transition-colors duration-300 ${
                    activeTab === 'courses' 
                      ? 'text-[var(--dominant-red)]' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Courses"
                >
                  <BookOpen className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab('programs')}
                  className={`relative z-10 p-3 rounded-xl transition-colors duration-300 ${
                    activeTab === 'programs' 
                      ? 'text-[var(--dominant-red)]' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Programs"
                >
                  <GraduationCap className="w-5 h-5" />
                </motion.button>
              </div>
              <DownloadStudents />
              <Button 
                className="gradient-primary text-white liquid-button"
                onClick={() => {
                  if (activeTab === 'courses') {
                    openCourseModal();
                  } else {
                    setSelectedProgram(null);
                    setIsProgramModalOpen(true);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'courses' ? 'Create Course' : 'Create Program'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid with Animation */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          variants={itemVariants} 
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {getCurrentStats().map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: [0.23, 1, 0.32, 1]
                  }
                }}
                whileHover={{ scale: 1.02 }}
                className="liquid-hover"
              >
                <Card className="card-hover border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold heading-bold text-gray-900">
                          {stat.value}
                        </p>
                        {stat.change && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            {stat.change}
                          </p>
                        )}
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Search and Filter Section */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-5xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={`Search ${activeTab} by course name, course code, program name, title, instructor, or category...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 liquid-morph border-gray-300 focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)]"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="liquid-button">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="liquid-button">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Content Grid with Animation */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((item, index) => (
              <motion.div
                key={`${activeTab}-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.23, 1, 0.32, 1]
                  }
                }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="liquid-hover"
              >
                <Card className="card-hover border-0 overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-[var(--dominant-red)] to-red-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-4 left-4">
                      {activeTab === 'courses' && item.program && (
                        <Badge className={`${getCategoryColor(item.program.program_name)} text-xs`}>
                          {item.program.program_code}
                        </Badge>
                      )}
                    </div>
                    <div className="absolute top-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 liquid-button">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                          onClick={() => {
                              if (activeTab === 'courses') {
                                setSelectedCourse(item);
                                setIsModalOpen(true);
                              } else {
                                setSelectedProgram(item);
                                setIsProgramModalOpen(true);
                              }
                            }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit {activeTab === 'courses' ? 'Course' : 'Program'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg mb-1">{activeTab === 'courses' ? `[${item.course_code}] ${item.course_name}` : item.program_name}</h3>
                      <p className="text-white text-sm mb-4 line-clamp-2">
                      {item.course_specialization }
                    </p>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {activeTab === 'courses' ? `${item.years} years` : `${item.years} years`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                                      <Button variant="outline" size="sm" className="liquid-button">
                            <BookMarked className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="gradient-primary text-white liquid-button"
                            onClick={() => {
                              if (activeTab === 'courses') {
                                setSelectedCourse(item);
                                setIsSubjectModalOpen(true);
                              } else {
                                setSelectedProgram(item);
                                setIsProgramDetailsModalOpen(true);
                              }
                            }}
                          >
                            View {activeTab === 'courses' ? 'Course' : 'Program'} Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          {activeTab === 'courses' ? (
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          ) : (
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          )}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab} found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search or filter criteria.
          </p>
          <Button className="gradient-primary text-white liquid-button">
            <Plus className="w-4 h-4 mr-2" />
            Create {activeTab === 'courses' ? 'Course' : 'Program'}
          </Button>
        </motion.div>
      )}

      <CourseModal
        isOpen={isModalOpen}
        onClose={closeCourseModal}
        onSubmit={handleCourseSubmit}
        course={selectedCourse}
        programs={programs}
        isLoading={isLoading}
      />
      
       <ProgramModal
         isOpen={isProgramModalOpen}
         onClose={() => setIsProgramModalOpen(false)}
         onSubmit={handleProgramSubmit}
         program={selectedProgram}
         isLoading={isLoading}
       />
      
      <ProgramDetailsModal
        isOpen={isProgramDetailsModalOpen}
        onClose={() => setIsProgramDetailsModalOpen(false)}
        program={selectedProgram}
        courses={courses || []}
      />
      
      <SubjectDetailsModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        course={selectedCourse}
        programType={getProgramTypeForCourse(selectedCourse)}
        onAddSubject={() => {
          setSelectedSubject(null);
          setIsSubjectFormModalOpen(true);
        }}
        onEditSubject={(subject) => {
          setSelectedSubject(subject);
          setIsSubjectFormModalOpen(true);
        }}
        onDeleteSubject={(subject) => {
          setSelectedItem(subject);
          setIsDeleteModalOpen(true);
        }}
      />
      
      <SubjectModal
        isOpen={isSubjectFormModalOpen}
        onClose={() => setIsSubjectFormModalOpen(false)}
        onSubmit={handleSubjectSubmit}
        subject={selectedSubject}
        course={selectedCourse}
        programType={getProgramTypeForCourse(selectedCourse)}
        isLoading={isLoading}
      />
      
       <DeleteConfirmationModal
         isOpen={isDeleteModalOpen}
         onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={handleDeleteConfirm}
         title={`Delete ${activeTab === 'courses' ? 'Course' : 'Program'}`}
         message={`Are you sure you want to delete this ${activeTab === 'courses' ? 'course' : 'program'}? This action cannot be undone.`}
         isLoading={isLoading}
       />
       
       <SuccessAlert
         isVisible={alert.isVisible}
         message={alert.message}
         type={alert.type}
         onClose={() => setAlert({ ...alert, isVisible: false })}
       />
    </motion.div>
  );
};

export default Courses;