import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter,
  Plus,
  Minus,
  MoreVertical,
  Clock,
  Users,
  MapPin,
  Star,
  StarOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  GraduationCap,
  Building,
  DollarSign,
  Eye,
  Heart,
  HeartOff,
  ShoppingCart,
  Trash2,
  RefreshCw,
  Edit,
  UserCheck,
  AlertTriangle,
  Award,
  BookX,
  BookCheck,
  UserX,
  ChevronDown,
  ChevronRight,
  Info
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const AddingDroppingSubjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('current');
  const [activeTab, setActiveTab] = useState('enrolled');
  const [isLoading, setIsLoading] = useState(false);

  // Sample students data
  const students = [
    {
      id: 1,
      name: 'John Smith',
      studentId: 'STU001',
      email: 'john.smith@university.edu',
      program: 'Computer Science',
      year: 'Junior',
      gpa: 3.8,
      avatar: '/api/placeholder/40/40',
      enrolledSubjects: [1, 3, 5],
      completedSubjects: [7, 8, 9],
      totalCredits: 12,
      maxCredits: 18
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      studentId: 'STU002',
      email: 'sarah.johnson@university.edu',
      program: 'Mathematics',
      year: 'Senior',
      gpa: 3.9,
      avatar: '/api/placeholder/40/40',
      enrolledSubjects: [2, 4, 6],
      completedSubjects: [1, 7, 10, 11],
      totalCredits: 15,
      maxCredits: 18
    },
    {
      id: 3,
      name: 'Michael Chen',
      studentId: 'STU003',
      email: 'michael.chen@university.edu',
      program: 'Physics',
      year: 'Sophomore',
      gpa: 3.7,
      avatar: '/api/placeholder/40/40',
      enrolledSubjects: [1, 2],
      completedSubjects: [7, 8],
      totalCredits: 7,
      maxCredits: 18
    },
    {
      id: 4,
      name: 'Emily Davis',
      studentId: 'STU004',
      email: 'emily.davis@university.edu',
      program: 'English Literature',
      year: 'Freshman',
      gpa: 3.6,
      avatar: '/api/placeholder/40/40',
      enrolledSubjects: [3, 6],
      completedSubjects: [],
      totalCredits: 6,
      maxCredits: 18
    }
  ];

  // Sample subjects data with expanded information
  const availableSubjects = [
    {
      id: 1,
      code: 'CS101',
      title: 'Introduction to Computer Science',
      instructor: 'Dr. Sarah Johnson',
      credits: 3,
      schedule: 'MWF 09:00-10:00',
      room: 'Room A-101',
      capacity: 50,
      enrolled: 35,
      waitlist: 5,
      category: 'Computer Science',
      semester: 'Fall 2024',
      prerequisites: [],
      description: 'Fundamental concepts of computer science including programming basics, algorithms, and data structures.',
      fee: 1200,
      status: 'available',
      rating: 4.8,
      difficulty: 'Beginner'
    },
    {
      id: 2,
      code: 'MATH201',
      title: 'Calculus II',
      instructor: 'Prof. Michael Chen',
      credits: 4,
      schedule: 'TTh 11:00-12:30',
      room: 'Room B-205',
      capacity: 40,
      enrolled: 38,
      waitlist: 8,
      category: 'Mathematics',
      semester: 'Fall 2024',
      prerequisites: ['MATH101'],
      description: 'Advanced calculus topics including integration techniques, series, and differential equations.',
      fee: 1500,
      status: 'waitlist',
      rating: 4.5,
      difficulty: 'Intermediate'
    },
    {
      id: 3,
      code: 'ENG102',
      title: 'Advanced English Composition',
      instructor: 'Emily Davis',
      credits: 3,
      schedule: 'MWF 14:00-15:00',
      room: 'Room C-302',
      capacity: 30,
      enrolled: 25,
      waitlist: 0,
      category: 'English',
      semester: 'Fall 2024',
      prerequisites: ['ENG101'],
      description: 'Advanced writing techniques, research methods, and critical analysis of literature.',
      fee: 1000,
      status: 'available',
      rating: 4.7,
      difficulty: 'Intermediate'
    },
    {
      id: 4,
      code: 'PHYS301',
      title: 'Quantum Physics',
      instructor: 'Dr. James Wilson',
      credits: 4,
      schedule: 'TTh 13:00-14:30',
      room: 'Lab D-401',
      capacity: 25,
      enrolled: 25,
      waitlist: 12,
      category: 'Physics',
      semester: 'Fall 2024',
      prerequisites: ['PHYS201', 'MATH201'],
      description: 'Introduction to quantum mechanics, wave functions, and quantum systems.',
      fee: 1800,
      status: 'full',
      rating: 4.9,
      difficulty: 'Advanced'
    },
    {
      id: 5,
      code: 'BUS205',
      title: 'Digital Marketing Strategy',
      instructor: 'Lisa Anderson',
      credits: 3,
      schedule: 'MW 16:00-17:30',
      room: 'Room E-104',
      capacity: 35,
      enrolled: 20,
      waitlist: 0,
      category: 'Business',
      semester: 'Fall 2024',
      prerequisites: ['BUS101'],
      description: 'Modern digital marketing techniques, social media strategy, and analytics.',
      fee: 1300,
      status: 'available',
      rating: 4.6,
      difficulty: 'Beginner'
    },
    {
      id: 6,
      code: 'ART150',
      title: 'Digital Art and Design',
      instructor: 'David Brown',
      credits: 3,
      schedule: 'TTh 10:00-11:30',
      room: 'Studio F-201',
      capacity: 20,
      enrolled: 18,
      waitlist: 3,
      category: 'Arts',
      semester: 'Fall 2024',
      prerequisites: [],
      description: 'Introduction to digital art tools, design principles, and creative expression.',
      fee: 1400,
      status: 'available',
      rating: 4.4,
      difficulty: 'Beginner'
    },
    // Completed subjects
    {
      id: 7,
      code: 'ENG101',
      title: 'English Composition I',
      instructor: 'Prof. Jane Smith',
      credits: 3,
      schedule: 'MWF 10:00-11:00',
      room: 'Room C-101',
      category: 'English',
      semester: 'Spring 2024',
      status: 'completed',
      grade: 'A-',
      difficulty: 'Beginner'
    },
    {
      id: 8,
      code: 'MATH101',
      title: 'Calculus I',
      instructor: 'Dr. Robert Lee',
      credits: 4,
      schedule: 'TTh 09:00-10:30',
      room: 'Room B-101',
      category: 'Mathematics',
      semester: 'Spring 2024',
      status: 'completed',
      grade: 'B+',
      difficulty: 'Intermediate'
    },
    {
      id: 9,
      code: 'HIST101',
      title: 'World History',
      instructor: 'Prof. Maria Garcia',
      credits: 3,
      schedule: 'MWF 11:00-12:00',
      room: 'Room D-201',
      category: 'History',
      semester: 'Spring 2024',
      status: 'completed',
      grade: 'A',
      difficulty: 'Beginner'
    },
    {
      id: 10,
      code: 'BUS101',
      title: 'Introduction to Business',
      instructor: 'Prof. Tom Wilson',
      credits: 3,
      schedule: 'TTh 14:00-15:30',
      room: 'Room E-101',
      category: 'Business',
      semester: 'Fall 2023',
      status: 'completed',
      grade: 'A-',
      difficulty: 'Beginner'
    },
    {
      id: 11,
      code: 'PHYS201',
      title: 'Physics II',
      instructor: 'Dr. Anna Kim',
      credits: 4,
      schedule: 'MWF 13:00-14:30',
      room: 'Lab D-301',
      category: 'Physics',
      semester: 'Fall 2023',
      status: 'completed',
      grade: 'B',
      difficulty: 'Intermediate'
    }
  ];

  const categories = [
    'all',
    'Computer Science',
    'Mathematics',
    'English',
    'Physics',
    'Business',
    'Arts',
    'History'
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

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'waitlist':
        return 'bg-yellow-100 text-yellow-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'enrolled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade) => {
    if (grade?.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade?.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade?.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade?.startsWith('D')) return 'bg-orange-100 text-orange-800';
    if (grade?.startsWith('F')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get subjects by category for selected student
  const getStudentSubjects = (category) => {
    if (!selectedStudent) return [];
    
    switch (category) {
      case 'enrolled':
        return availableSubjects.filter(subject => 
          selectedStudent.enrolledSubjects.includes(subject.id)
        );
      case 'completed':
        return availableSubjects.filter(subject => 
          selectedStudent.completedSubjects.includes(subject.id)
        );
      case 'available':
        return availableSubjects.filter(subject => 
          !selectedStudent.enrolledSubjects.includes(subject.id) &&
          !selectedStudent.completedSubjects.includes(subject.id) &&
          subject.status !== 'completed'
        );
      default:
        return [];
    }
  };

  // Check for schedule conflicts
  const checkScheduleConflicts = (newSubjectId) => {
    if (!selectedStudent) return [];
    
    const newSubject = availableSubjects.find(s => s.id === newSubjectId);
    if (!newSubject || !newSubject.schedule) return [];
    
    const enrolledSubjects = getStudentSubjects('enrolled');
    const conflicts = [];
    
    enrolledSubjects.forEach(subject => {
      if (subject.schedule && hasTimeConflict(newSubject.schedule, subject.schedule)) {
        conflicts.push(subject);
      }
    });
    
    return conflicts;
  };

  // Check for prerequisite conflicts
  const checkPrerequisites = (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    if (!subject || !subject.prerequisites || !selectedStudent) return [];
    
    const completedCodes = selectedStudent.completedSubjects.map(id => {
      const completedSubject = availableSubjects.find(s => s.id === id);
      return completedSubject ? completedSubject.code : null;
    }).filter(Boolean);
    
    return subject.prerequisites.filter(prereq => !completedCodes.includes(prereq));
  };

  const hasTimeConflict = (schedule1, schedule2) => {
    // Simple time conflict check - in real app, this would be more sophisticated
    const days1 = schedule1.split(' ')[0];
    const days2 = schedule2.split(' ')[0];
    const time1 = schedule1.split(' ')[1];
    const time2 = schedule2.split(' ')[1];
    
    // Check if days overlap
    const daysOverlap = days1.split('').some(day => days2.includes(day));
    
    if (!daysOverlap) return false;
    
    // Simple time overlap check
    return time1 === time2;
  };

  // Handle subject enrollment
  const handleEnrollSubject = async (subjectId) => {
    if (!selectedStudent) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update student's enrolled subjects
    const updatedStudents = students.map(student => {
      if (student.id === selectedStudent.id) {
        const updatedStudent = {
          ...student,
          enrolledSubjects: [...student.enrolledSubjects, subjectId]
        };
        setSelectedStudent(updatedStudent);
        return updatedStudent;
      }
      return student;
    });
    
    setIsLoading(false);
  };

  // Handle subject drop
  const handleDropSubject = async (subjectId) => {
    if (!selectedStudent) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update student's enrolled subjects
    const updatedStudents = students.map(student => {
      if (student.id === selectedStudent.id) {
        const updatedStudent = {
          ...student,
          enrolledSubjects: student.enrolledSubjects.filter(id => id !== subjectId)
        };
        setSelectedStudent(updatedStudent);
        return updatedStudent;
      }
      return student;
    });
    
    setIsLoading(false);
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current tab subjects with filters
  const getCurrentTabSubjects = () => {
    const subjects = getStudentSubjects(activeTab);
    return subjects.filter(subject => {
      const matchesCategory = selectedCategory === 'all' || subject.category === selectedCategory;
      return matchesCategory;
    });
  };

  // Calculate stats for selected student
  const getStudentStats = () => {
    if (!selectedStudent) return null;
    
    const enrolledSubjects = getStudentSubjects('enrolled');
    const completedSubjects = getStudentSubjects('completed');
    const availableSubjects = getStudentSubjects('available');
    
    const totalCredits = enrolledSubjects.reduce((sum, subject) => sum + (subject.credits || 0), 0);
    const completedCredits = completedSubjects.reduce((sum, subject) => sum + (subject.credits || 0), 0);
    const totalFees = enrolledSubjects.reduce((sum, subject) => sum + (subject.fee || 0), 0);
    
    return {
      enrolled: enrolledSubjects.length,
      completed: completedSubjects.length,
      available: availableSubjects.length,
      totalCredits,
      completedCredits,
      totalFees,
      gpa: selectedStudent.gpa
    };
  };

  const stats = getStudentStats();

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
                <Users className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Student Subject Management
              </h1>
              <p className="text-gray-600 text-lg">
                Manage student enrollments, view subject conflicts, and track academic progress.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="liquid-button">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button className="gradient-primary text-white liquid-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student List Sidebar */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <Card className="card-hover border-0 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-lg font-bold heading-bold flex items-center">
                <User className="w-5 h-5 mr-2 text-[var(--dominant-red)]" />
                Students
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 liquid-morph"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer liquid-morph ${
                      selectedStudent?.id === student.id 
                        ? 'bg-[var(--dominant-red)]/5 border-l-4 border-l-[var(--dominant-red)]' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStudent(student)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[var(--dominant-red)] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.studentId}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {student.program}
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            GPA: {student.gpa}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Area */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          {selectedStudent ? (
            <div className="space-y-6">
              {/* Student Info Header */}
              <Card className="card-hover border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-[var(--dominant-red)] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold heading-bold text-gray-900">
                          {selectedStudent.name}
                        </h2>
                        <p className="text-gray-600">{selectedStudent.studentId} • {selectedStudent.program}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            {selectedStudent.year}
                          </Badge>
                          <Badge className="bg-green-100 text-green-800">
                            GPA: {selectedStudent.gpa}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800">
                            Credits: {selectedStudent.totalCredits}/{selectedStudent.maxCredits}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="liquid-button">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Student
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="card-hover border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Enrolled</p>
                          <p className="text-2xl font-bold heading-bold text-gray-900">{stats.enrolled}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="card-hover border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Completed</p>
                          <p className="text-2xl font-bold heading-bold text-gray-900">{stats.completed}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-50">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="card-hover border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Available</p>
                          <p className="text-2xl font-bold heading-bold text-gray-900">{stats.available}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-yellow-50">
                          <BookX className="w-5 h-5 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="card-hover border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Fees</p>
                          <p className="text-2xl font-bold heading-bold text-gray-900">${stats.totalFees.toLocaleString()}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-50">
                          <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Subject Management Tabs */}
              <Card className="card-hover border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold heading-bold">Subject Management</CardTitle>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-48 liquid-morph">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="enrolled" className="flex items-center space-x-2">
                        <BookCheck className="w-4 h-4" />
                        <span>Enrolled ({stats?.enrolled || 0})</span>
                      </TabsTrigger>
                      <TabsTrigger value="completed" className="flex items-center space-x-2">
                        <Award className="w-4 h-4" />
                        <span>Completed ({stats?.completed || 0})</span>
                      </TabsTrigger>
                      <TabsTrigger value="available" className="flex items-center space-x-2">
                        <BookX className="w-4 h-4" />
                        <span>Available ({stats?.available || 0})</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="enrolled" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getCurrentTabSubjects().map((subject) => {
                          const conflicts = checkScheduleConflicts(subject.id);
                          return (
                            <motion.div
                              key={subject.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="liquid-hover"
                            >
                              <Card className="card-hover border-0 shadow-sm h-full border-l-4 border-l-green-500">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <Badge variant="outline" className="text-xs font-medium">
                                          {subject.code}
                                        </Badge>
                                        <Badge className={getDifficultyColor(subject.difficulty)}>
                                          {subject.difficulty}
                                        </Badge>
                                        {conflicts.length > 0 && (
                                          <Badge className="bg-red-100 text-red-800">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Conflict
                                          </Badge>
                                        )}
                                      </div>
                                      <CardTitle className="text-lg font-bold heading-bold text-gray-900 mb-1">
                                        {subject.title}
                                      </CardTitle>
                                      <CardDescription className="text-sm text-gray-600">
                                        {subject.instructor}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="flex items-center text-gray-600">
                                        <GraduationCap className="w-4 h-4 mr-2" />
                                        {subject.credits} Credits
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {subject.schedule}
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {subject.room}
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        ${subject.fee?.toLocaleString()}
                                      </div>
                                    </div>

                                    {conflicts.length > 0 && (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center text-red-800 mb-2">
                                          <AlertTriangle className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Schedule Conflicts</span>
                                        </div>
                                        {conflicts.map((conflict) => (
                                          <p key={conflict.id} className="text-sm text-red-700">
                                            • {conflict.code}: {conflict.schedule}
                                          </p>
                                        ))}
                                      </div>
                                    )}

                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDropSubject(subject.id)}
                                      disabled={isLoading}
                                      className="w-full liquid-button"
                                    >
                                      <Minus className="w-4 h-4 mr-2" />
                                      Drop Subject
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="completed" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getCurrentTabSubjects().map((subject) => (
                          <motion.div
                            key={subject.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="liquid-hover"
                          >
                            <Card className="card-hover border-0 shadow-sm h-full border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Badge variant="outline" className="text-xs font-medium">
                                        {subject.code}
                                      </Badge>
                                      <Badge className={getDifficultyColor(subject.difficulty)}>
                                        {subject.difficulty}
                                      </Badge>
                                      {subject.grade && (
                                        <Badge className={getGradeColor(subject.grade)}>
                                          {subject.grade}
                                        </Badge>
                                      )}
                                    </div>
                                    <CardTitle className="text-lg font-bold heading-bold text-gray-900 mb-1">
                                      {subject.title}
                                    </CardTitle>
                                    <CardDescription className="text-sm text-gray-600">
                                      {subject.instructor} • {subject.semester}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center text-gray-600">
                                      <GraduationCap className="w-4 h-4 mr-2" />
                                      {subject.credits} Credits
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Completed
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                                    <Award className="w-5 h-5 text-blue-600 mr-2" />
                                    <span className="text-blue-800 font-medium">
                                      Grade: {subject.grade || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="available" className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getCurrentTabSubjects().map((subject) => {
                          const missingPrereqs = checkPrerequisites(subject.id);
                          const conflicts = checkScheduleConflicts(subject.id);
                          const hasIssues = missingPrereqs.length > 0 || conflicts.length > 0;
                          
                          return (
                            <motion.div
                              key={subject.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="liquid-hover"
                            >
                              <Card className={`card-hover border-0 shadow-sm h-full border-l-4 ${
                                hasIssues ? 'border-l-yellow-500' : 'border-l-gray-300'
                              }`}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <Badge variant="outline" className="text-xs font-medium">
                                          {subject.code}
                                        </Badge>
                                        <Badge className={getDifficultyColor(subject.difficulty)}>
                                          {subject.difficulty}
                                        </Badge>
                                        <Badge className={getStatusColor(subject.status)}>
                                          {subject.status}
                                        </Badge>
                                        {hasIssues && (
                                          <Badge className="bg-yellow-100 text-yellow-800">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Issues
                                          </Badge>
                                        )}
                                      </div>
                                      <CardTitle className="text-lg font-bold heading-bold text-gray-900 mb-1">
                                        {subject.title}
                                      </CardTitle>
                                      <CardDescription className="text-sm text-gray-600">
                                        {subject.instructor}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="flex items-center text-gray-600">
                                        <GraduationCap className="w-4 h-4 mr-2" />
                                        {subject.credits} Credits
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        ${subject.fee?.toLocaleString()}
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {subject.schedule}
                                      </div>
                                      <div className="flex items-center text-gray-600">
                                        <Users className="w-4 h-4 mr-2" />
                                        {subject.enrolled}/{subject.capacity}
                                      </div>
                                    </div>

                                    {missingPrereqs.length > 0 && (
                                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center text-yellow-800 mb-2">
                                          <AlertCircle className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Missing Prerequisites</span>
                                        </div>
                                        <p className="text-sm text-yellow-700">
                                          Required: {missingPrereqs.join(', ')}
                                        </p>
                                      </div>
                                    )}

                                    {conflicts.length > 0 && (
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-center text-red-800 mb-2">
                                          <AlertTriangle className="w-4 h-4 mr-2" />
                                          <span className="font-medium">Schedule Conflicts</span>
                                        </div>
                                        {conflicts.map((conflict) => (
                                          <p key={conflict.id} className="text-sm text-red-700">
                                            • {conflict.code}: {conflict.schedule}
                                          </p>
                                        ))}
                                      </div>
                                    )}

                                    <Button
                                      onClick={() => handleEnrollSubject(subject.id)}
                                      disabled={isLoading || subject.status === 'full' || hasIssues}
                                      className="w-full gradient-primary text-white liquid-button"
                                    >
                                      {isLoading ? (
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                      ) : subject.status === 'full' ? (
                                        <XCircle className="w-4 h-4 mr-2" />
                                      ) : hasIssues ? (
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                      ) : (
                                        <Plus className="w-4 h-4 mr-2" />
                                      )}
                                      {subject.status === 'full' ? 'Full' : 
                                       hasIssues ? 'Cannot Enroll' :
                                       'Enroll Now'}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="card-hover border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <UserX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold heading-bold text-gray-900 mb-2">
                  Select a Student
                </h3>
                <p className="text-gray-600">
                  Choose a student from the list to manage their subjects and view enrollment details.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AddingDroppingSubjects;
