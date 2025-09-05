import React, { useState } from 'react';
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
  Building
} from 'lucide-react';
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

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedYear, setSelectedYear] = useState('1st Year');
  const [selectedSemester, setSelectedSemester] = useState('1st Semester');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  
  // New state for toggle functionality
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'programs'

  const courses = [
    {
      id: 1,
      title: 'Bachelor of Science in Computer Science',
      description: 'Focuses on the fundamentals of computing, algorithms, and software development.',
      instructor: 'Prof. Elena Rodriguez',
      duration: '4 years',
      students: 120,
      maxStudents: 150,
      startDate: '2025-08-15',
      status: 'active',
      category: 'Bachelor\'s Degree',
      price: '₱45,000/sem',
      image: '/api/placeholder/300/200'
    },
    {
      id: 2,
      title: 'Bachelor of Science in Business Administration',
      description: 'Covers core business functions, management principles, and strategic decision-making.',
      instructor: 'Dr. Robert Garcia',
      duration: '4 years',
      students: 150,
      maxStudents: 180,
      startDate: '2025-08-15',
      status: 'active',
      category: 'Bachelor\'s Degree',
      price: '₱40,000/sem',
      image: '/api/placeholder/300/200'
    },
    {
      id: 3,
      title: 'Bachelor of Science in Hospitality Management',
      description: 'Prepares students for careers in hotel, restaurant, and tourism industries.',
      instructor: 'Chef Maria Santos',
      duration: '4 years',
      students: 90,
      maxStudents: 100,
      startDate: '2025-08-15',
      status: 'upcoming',
      category: 'Bachelor\'s Degree',
      price: '₱42,000/sem',
      image: '/api/placeholder/300/200'
    },
    {
      id: 4,
      title: 'Bachelor of Science in Nursing',
      description: 'Comprehensive program for aspiring nurses, covering patient care and medical practices.',
      instructor: 'Dean Anna Lim',
      duration: '4 years',
      students: 100,
      maxStudents: 120,
      startDate: '2025-08-15',
      status: 'active',
      category: 'Bachelor\'s Degree',
      price: '₱50,000/sem',
      image: '/api/placeholder/300/200'
    },
    {
      id: 5,
      title: 'Bachelor of Science in Information Technology',
      description: 'Focuses on software, hardware, and networking, preparing students for IT careers.',
      instructor: 'Engr. John Dela Cruz',
      duration: '4 years',
      students: 130,
      maxStudents: 160,
      startDate: '2025-08-15',
      status: 'active',
      category: 'Bachelor\'s Degree',
      price: '₱46,000/sem',
      image: '/api/placeholder/300/200'
    },
    {
      id: 6,
      title: 'Bachelor of Science in Accountancy',
      description: 'Provides in-depth knowledge of accounting principles, financial reporting, and auditing.',
      instructor: 'CPA Christine Reyes',
      duration: '4 years',
      students: 110,
      maxStudents: 130,
      startDate: '2025-08-15',
      status: 'upcoming',
      category: 'Bachelor\'s Degree',
      price: '₱43,000/sem',
      image: '/api/placeholder/300/200'
    }
  ];

  // Filtered programs data - only showing Senior High School, Diploma, and Bachelor's Degree
  const programs = [
    {
      id: 1,
      title: 'Senior High School - STEM Strand',
      description: 'Science, Technology, Engineering, and Mathematics track for college-bound students.',
      coordinator: 'Dr. Sarah Johnson',
      duration: '2 years',
      students: 180,
      maxStudents: 200,
      startDate: '2025-06-15',
      status: 'active',
      category: 'Senior High School',
      price: '₱25,000/sem',
      image: '/api/placeholder/300/200',
      type: 'senior_high'
    },
    {
      id: 2,
      title: 'Senior High School - ABM Strand',
      description: 'Accountancy, Business, and Management track for business-oriented students.',
      coordinator: 'Prof. Michael Chen',
      duration: '2 years',
      students: 160,
      maxStudents: 180,
      startDate: '2025-06-15',
      status: 'active',
      category: 'Senior High School',
      price: '₱23,000/sem',
      image: '/api/placeholder/300/200',
      type: 'senior_high'
    },
    {
      id: 3,
      title: 'Diploma in Computer Programming',
      description: 'Intensive 2-year program focusing on practical programming skills and software development.',
      coordinator: 'Engr. Lisa Wong',
      duration: '2 years',
      students: 85,
      maxStudents: 100,
      startDate: '2025-08-15',
      status: 'upcoming',
      category: 'Diploma',
      price: '₱35,000/sem',
      image: '/api/placeholder/300/200',
      type: 'diploma'
    },
    {
      id: 4,
      title: 'Diploma in Culinary Arts',
      description: 'Comprehensive culinary program covering cooking techniques, food safety, and restaurant management.',
      coordinator: 'Chef Antonio Rivera',
      duration: '18 months',
      students: 60,
      maxStudents: 75,
      startDate: '2025-07-01',
      status: 'active',
      category: 'Diploma',
      price: '₱38,000/sem',
      image: '/api/placeholder/300/200',
      type: 'diploma'
    },
    {
      id: 5,
      title: 'Bachelor of Arts in Psychology',
      description: 'Comprehensive study of human behavior, mental processes, and psychological research methods.',
      instructor: 'Dr. Maria Gonzales',
      duration: '4 years',
      students: 95,
      maxStudents: 120,
      startDate: '2025-08-15',
      status: 'active',
      category: 'Bachelor\'s Degree',
      price: '₱41,000/sem',
      image: '/api/placeholder/300/200',
      type: 'bachelors'
    },
    {
      id: 6,
      title: 'Bachelor of Science in Civil Engineering',
      description: 'Engineering program focusing on infrastructure design, construction, and project management.',
      instructor: 'Engr. Carlos Mendoza',
      duration: '5 years',
      students: 140,
      maxStudents: 160,
      startDate: '2025-08-15',
      status: 'upcoming',
      category: 'Bachelor\'s Degree',
      price: '₱48,000/sem',
      image: '/api/placeholder/300/200',
      type: 'bachelors'
    }
  ];

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

  const filteredData = getCurrentData().filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.instructor || item.coordinator).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || item.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const openModal = (item) => {
    setSelectedCourse(item);
    setIsModalOpen(true);
    setSelectedYear('1st Year');
    setSelectedSemester('1st Semester');
    setIsYearDropdownOpen(false);
    setIsSemesterDropdownOpen(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

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
              
              <Button className="gradient-primary text-white liquid-button">
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
                      <Badge className={`${getCategoryColor(item.category)} text-xs`}>
                        {item.category}
                      </Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 liquid-button">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit {activeTab === 'courses' ? 'Course' : 'Program'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-white/80 text-sm">{item.instructor || item.coordinator}</p>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${getStatusColor(item.status)} text-xs`}>
                        {item.status}
                      </Badge>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          {item.duration}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          {item.students}/{item.maxStudents}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {item.startDate}
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
                            onClick={() => openModal(item)}
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

      {/* Modal */}
      {isModalOpen && selectedCourse && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
        >
          <motion.div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedCourse.instructor || selectedCourse.coordinator}</p>
                </div>
                <Badge className={`${getCategoryColor(selectedCourse.category)}`}>
                  {selectedCourse.category}
                </Badge>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Course Details */}
              {activeTab === 'courses' && (
                <>
                  {/* Year and Semester Selection */}
                  <div className="flex space-x-4 mb-6">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Academic Year
                      </label>
                      <div className="relative custom-dropdown">
                        <motion.button
                          onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                          className="w-full px-4 py-2 rounded-lg dropdown-button bg-white text-left flex items-center justify-between"
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>{selectedYear}</span>
                          <motion.div
                            animate={{ rotate: isYearDropdownOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </motion.div>
                        </motion.button>
                        
                        {isYearDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg dropdown-menu z-10 overflow-hidden"
                          >
                            {yearOptions.map((year, index) => (
                              <motion.button
                                key={year}
                                onClick={() => {
                                  setSelectedYear(year);
                                  setIsYearDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left dropdown-item ${
                                  selectedYear === year ? 'selected' : ''
                                }`}
                                whileHover={{ backgroundColor: selectedYear === year ? undefined : '#f9fafb' }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                {year}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semester
                      </label>
                      <div className="relative custom-dropdown">
                        <motion.button
                          onClick={() => setIsSemesterDropdownOpen(!isSemesterDropdownOpen)}
                          className="w-full px-4 py-2 rounded-lg dropdown-button bg-white text-left flex items-center justify-between"
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>{selectedSemester}</span>
                          <motion.div
                            animate={{ rotate: isSemesterDropdownOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </motion.div>
                        </motion.button>
                        
                        {isSemesterDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg dropdown-menu z-10 overflow-hidden"
                          >
                            {semesterOptions.map((semester, index) => (
                              <motion.button
                                key={semester}
                                onClick={() => {
                                  setSelectedSemester(semester);
                                  setIsSemesterDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left dropdown-item ${
                                  selectedSemester === semester ? 'selected' : ''
                                }`}
                                whileHover={{ backgroundColor: selectedSemester === semester ? undefined : '#f9fafb' }}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                              >
                                {semester}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subjects List */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedYear} - {selectedSemester} Subjects
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {getCurrentSubjects().map((subject, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white p-4 rounded-lg subject-card border border-gray-100"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-[var(--dominant-red)] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                              {index + 1}
                            </div>
                            <span className="text-gray-800 font-medium">{subject}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {getCurrentSubjects().length === 0 && (
                      <div className="text-center py-8">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No subjects available for this selection.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Program Details */}
              {activeTab === 'programs' && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Program Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Program Type</label>
                        <p className="text-gray-900 font-medium">{selectedCourse?.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Duration</label>
                        <p className="text-gray-900 font-medium">{selectedCourse?.duration}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Coordinator</label>
                        <p className="text-gray-900 font-medium">{selectedCourse?.coordinator}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Enrollment</label>
                        <p className="text-gray-900 font-medium">{selectedCourse?.students}/{selectedCourse?.maxStudents} students</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                        <p className="text-gray-900 font-medium">{selectedCourse?.startDate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tuition Fee</label>
                        <p className="text-gray-900 font-medium">{selectedCourse?.price}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900 mt-2">{selectedCourse?.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <Button
                onClick={closeModal}
                className="gradient-primary text-white modal-liquid-button"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Courses;

