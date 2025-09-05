import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Clock,
  Users,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Download,
  Play,
  BookMarked,
  Award,
  ChevronDown,
  GraduationCap,
  School,
  Building,
  X,
  ChevronRight
} from 'lucide-react';
import { courseAPI, programAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import SuccessAlert from '../modals/SuccessAlert';

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
  const [courses, setCourses] = useState();
  const [programs, setPrograms] = useState();
  const [isProgramDetailsModalOpen, setIsProgramDetailsModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  
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

  // Sample subjects data for each course
  const courseSubjects = {
    1: { // Computer Science
      "1st Year": {
        "1st Semester": [
          "Introduction to Computing",
          "Computer Programming 1",
          "Mathematics in the Modern World",
          "Understanding the Self",
          "Readings in Philippine History",
          "The Contemporary World",
          "Physical Education 1",
          "National Service Training Program 1"
        ],
        "2nd Semester": [
          "Computer Programming 2",
          "Discrete Mathematics",
          "Purposive Communication",
          "Art Appreciation",
          "Ethics",
          "Science, Technology and Society",
          "Physical Education 2",
          "National Service Training Program 2"
        ]
      },
      "2nd Year": {
        "1st Semester": [
          "Data Structures and Algorithms",
          "Object-Oriented Programming",
          "Digital Logic Design",
          "Statistics and Probability",
          "Filipino sa Piling Larangan",
          "Physical Education 3"
        ],
        "2nd Semester": [
          "Database Management Systems",
          "Computer Organization and Architecture",
          "Web Development",
          "Linear Algebra",
          "Rizal's Life and Works",
          "Physical Education 4"
        ]
      },
      "3rd Year": {
        "1st Semester": [
          "Software Engineering 1",
          "Operating Systems",
          "Computer Networks",
          "Human Computer Interaction",
          "Elective 1"
        ],
        "2nd Semester": [
          "Software Engineering 2",
          "Information Assurance and Security",
          "Systems Integration and Architecture",
          "Automata Theory and Formal Languages",
          "Elective 2"
        ]
      },
      "4th Year": {
        "1st Semester": [
          "Capstone Project 1",
          "Machine Learning",
          "Mobile Application Development",
          "Professional Issues in Computing",
          "Elective 3"
        ],
        "2nd Semester": [
          "Capstone Project 2",
          "Internship/Practicum",
          "Emerging Technologies",
          "Elective 4"
        ]
      }
    },
    2: { // Business Administration
      "1st Year": {
        "1st Semester": [
          "Introduction to Business",
          "Business Mathematics",
          "Mathematics in the Modern World",
          "Understanding the Self",
          "Readings in Philippine History",
          "The Contemporary World",
          "Physical Education 1",
          "National Service Training Program 1"
        ],
        "2nd Semester": [
          "Principles of Management",
          "Business Statistics",
          "Purposive Communication",
          "Art Appreciation",
          "Ethics",
          "Science, Technology and Society",
          "Physical Education 2",
          "National Service Training Program 2"
        ]
      },
      "2nd Year": {
        "1st Semester": [
          "Financial Management",
          "Marketing Management",
          "Operations Management",
          "Business Law",
          "Filipino sa Piling Larangan",
          "Physical Education 3"
        ],
        "2nd Semester": [
          "Human Resource Management",
          "Strategic Management",
          "International Business",
          "Business Research Methods",
          "Rizal's Life and Works",
          "Physical Education 4"
        ]
      },
      "3rd Year": {
        "1st Semester": [
          "Organizational Behavior",
          "Business Analytics",
          "Entrepreneurship",
          "Corporate Finance",
          "Elective 1"
        ],
        "2nd Semester": [
          "Supply Chain Management",
          "Digital Marketing",
          "Business Ethics and Social Responsibility",
          "Project Management",
          "Elective 2"
        ]
      },
      "4th Year": {
        "1st Semester": [
          "Business Capstone Project 1",
          "Advanced Strategic Management",
          "Business Consulting",
          "Leadership and Change Management",
          "Elective 3"
        ],
        "2nd Semester": [
          "Business Capstone Project 2",
          "Internship/Practicum",
          "Global Business Environment",
          "Elective 4"
        ]
      }
    }
    // Add similar structure for other courses (3, 4, 5, 6)
  };

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesterOptions = ['1st Semester', '2nd Semester'];

  const stats = [
    {
      title: 'Total Courses',
      value: '156',
      change: '+8.2%',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Courses',
      value: '124',
      change: '+12.5%',
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Students',
      value: '2,847',
      change: '+23.1%',
      icon: Users,
      color: 'text-[var(--dominant-red)]',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Avg Rating',
      value: '4.7',
      change: '+0.3',
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const programStats = [
    {
      title: 'Total Programs',
      value: '24',
      change: '+5.1%',
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Senior High Programs',
      value: '8',
      change: '+2.0%',
      icon: School,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Diploma Programs',
      value: '12',
      change: '+15.2%',
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Bachelor Programs',
      value: '18',
      change: '+8.7%',
      icon: Building,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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

  // Add null check to prevent TypeError when courses or programs is undefined
  const currentData = getCurrentData() || [];
  const filteredData = currentData.filter(item => {
    const matchesSearch =
  (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
        // Update existing course
        response = await courseAPI.update(selectedCourse.id, courseData);
        if (response.success) {
          // Update the courses list
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
        // Create new course
        response = await courseAPI.create(courseData);
        if (response.success) {
          // Add the new course to the list
          setCourses(prevCourses => [...prevCourses, response.data]);
          setAlert({
            isVisible: true,
            message: 'Course created successfully!',
            type: 'success'
          });
        }
      }
      
      // Close the modal
      closeCourseModal();
    } catch (error) {
      console.error('Error saving course:', error);
      setAlert({
        isVisible: true,
        message: `Failed to ${selectedCourse ? 'update' : 'create'} course. ${error.message || 'Please try again.'}`,
        type: 'error'
      });
      throw error; // Rethrow to be handled by the modal
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
        // Update existing program
        response = await programAPI.update(selectedProgram.id, programData);
        if (response.success) {
          // Update the programs list
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
        // Create new program
        response = await programAPI.create(programData);
        if (response.success) {
          // Add the new program to the list
          setPrograms(prevPrograms => [...prevPrograms, response.data]);
          setAlert({
            isVisible: true,
            message: 'Program created successfully!',
            type: 'success'
          });
        }
      }
      
      // Close the modal
      setIsProgramModalOpen(false);
      setSelectedProgram(null);
    } catch (error) {
      console.error('Error saving program:', error);
      setAlert({
        isVisible: true,
        message: `Failed to ${selectedProgram ? 'update' : 'create'} program. ${error.message || 'Please try again.'}`,
        type: 'error'
      });
      throw error; // Rethrow to be handled by the modal
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
      
      if (activeTab === 'courses') {
        // Delete course
        response = await courseAPI.delete(selectedItem.id);
        if (response.success) {
          // Remove the course from the list
          setCourses(prevCourses => prevCourses.filter(course => course.id !== selectedItem.id));
          setAlert({
            isVisible: true,
            message: 'Course deleted successfully!',
            type: 'success'
          });
        }
      } else {
        // Delete program
        response = await programAPI.delete(selectedItem.id);
        if (response.success) {
          // Remove the program from the list
          setPrograms(prevPrograms => prevPrograms.filter(program => program.id !== selectedItem.id));
          setAlert({
            isVisible: true,
            message: 'Program deleted successfully!',
            type: 'success'
          });
        }
      }
      
      // Close the modal
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error(`Error deleting ${activeTab === 'courses' ? 'course' : 'program'}:`, error);
      setAlert({
        isVisible: true,
        message: `Failed to delete ${activeTab === 'courses' ? 'course' : 'program'}. ${error.message || 'Please try again.'}`,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // State for selected item to delete
  const [selectedItem, setSelectedItem] = useState(null);

  const getCurrentSubjects = () => {
    if (!selectedCourse || !courseSubjects[selectedCourse.id]) {
      return [];
    }
    return courseSubjects[selectedCourse.id][selectedYear]?.[selectedSemester] || [];
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
              {/* Toggle Buttons with Icons Only */}
              <div className="relative bg-gray-100 rounded-2xl p-1 inline-flex">
                {/* Animated Background */}
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
                
                {/* Toggle Buttons - Icons Only */}
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
                        <p className="text-sm text-green-600 font-medium mt-1">
                          {stat.change}
                        </p>
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
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={`Search ${activeTab} by title, instructor, or category...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 liquid-morph"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph"
                >
                  <option value="all">All {activeTab === 'courses' ? 'Courses' : 'Programs'}</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
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
      </motion.div>

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
                  {/* Item Image */}
                  <div className="h-48 bg-gradient-to-br from-[var(--dominant-red)] to-red-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute top-4 left-4">
                      {activeTab === 'courses' && item.program && (
                        <Badge className={`${getCategoryColor(item.program.program_name)} text-xs`}>
                          {item.program.program_name}
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
                      <h3 className="text-white font-bold text-lg mb-1">{activeTab === 'courses' ? item.course_name : item.program_name}</h3>
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

      {/* Course Modal */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={closeCourseModal}
        onSubmit={handleCourseSubmit}
        course={selectedCourse}
        programs={programs}
        isLoading={isLoading}
      />
      
      {/* Program Modal */}
       <ProgramModal
         isOpen={isProgramModalOpen}
         onClose={() => setIsProgramModalOpen(false)}
         onSubmit={handleProgramSubmit}
         program={selectedProgram}
         isLoading={isLoading}
       />
      
      {/* Program Details Modal */}
      <ProgramDetailsModal
        isOpen={isProgramDetailsModalOpen}
        onClose={() => setIsProgramDetailsModalOpen(false)}
        program={selectedProgram}
        courses={courses || []}
      />
      
      {/* Subject Details Modal */}
      <SubjectDetailsModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        course={selectedCourse}
      />
      
      {/* Delete Confirmation Modal */}
       <DeleteConfirmationModal
         isOpen={isDeleteModalOpen}
         onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={handleDeleteConfirm}
         title={`Delete ${activeTab === 'courses' ? 'Course' : 'Program'}`}
         message={`Are you sure you want to delete this ${activeTab === 'courses' ? 'course' : 'program'}?`}
         itemName={selectedItem?.course_name || selectedItem?.program_name}
         isLoading={isLoading}
       />
      
      {/* Success Alert */}
       <SuccessAlert
         isVisible={alert.isVisible}
         message={alert.message}
         type={alert.type}
         onClose={() => setAlert({...alert, isVisible: false})}
         autoClose={true}
         duration={3000}
       />
    </motion.div>
  );
};

export default Courses;

  