import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookUser,
  Search, 
  Filter,
  Save,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Settings,
  Users,
  ClipboardCheck,
  ClipboardX,
  BarChart,
  Download
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const Grades = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [students, setStudents] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      studentId: 'S-2024-001',
      course: 'Advanced Mathematics',
      section: 'A',
      grade: '92',
      status: 'Graded',
      avatar: '/avatars/01.png',
    },
    {
      id: 2,
      name: 'Michael Chen',
      studentId: 'S-2024-002',
      course: 'Computer Science Lab',
      section: 'B',
      grade: '88',
      status: 'Graded',
      avatar: '/avatars/02.png',
    },
    {
      id: 3,
      name: 'Emily Davis',
      studentId: 'S-2024-003',
      course: 'Digital Marketing',
      section: 'A',
      grade: '',
      status: 'Pending',
      avatar: '/avatars/03.png',
    },
    {
      id: 4,
      name: 'James Wilson',
      studentId: 'S-2024-004',
      course: 'Advanced Mathematics',
      section: 'A',
      grade: '76',
      status: 'Graded',
      avatar: '/avatars/04.png',
    },
    {
      id: 5,
      name: 'Linda Rodriguez',
      studentId: 'S-2024-005',
      course: 'Computer Science Lab',
      section: 'B',
      grade: '',
      status: 'Pending',
      avatar: '/avatars/05.png',
    },
    {
      id: 6,
      name: 'Robert Brown',
      studentId: 'S-2024-006',
      course: 'Digital Marketing',
      section: 'A',
      grade: '85',
      status: 'Graded',
      avatar: '/avatars/06.png',
    }
  ]);

  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      change: '+2 this week',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Graded Students',
      value: students.filter(s => s.status === 'Graded').length,
      change: '+5 today',
      icon: ClipboardCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Grades',
      value: students.filter(s => s.status === 'Pending').length,
      change: '2 overdue',
      icon: ClipboardX,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Class Average',
      value: '86.5',
      change: '+1.2%',
      icon: BarChart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
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
      case 'Graded':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGradeChange = (id, newGrade) => {
    setStudents(students.map(student => {
      if (student.id === id) {
        return { 
            ...student, 
            grade: newGrade, 
            status: newGrade ? 'Graded' : 'Pending' 
        };
      }
      return student;
    }));
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         student.status.toLowerCase() === selectedFilter ||
                         student.section === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
                <BookUser className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Grade Management
              </h1>
              <p className="text-gray-600 text-lg">
                View students, input grades, and manage academic records efficiently.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="liquid-button">
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
              <Button className="gradient-primary text-white liquid-button">
                <Download className="w-4 h-4 mr-2" />
                Export Grades
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              whileHover={{ scale: 1.02 }}
              className="liquid-hover"
            >
              <Card className="card-hover no-hover border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold heading-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className={`text-sm ${stat.change.startsWith('-') ? 'text-red-600' : 'text-green-600'} font-medium mt-1`}>
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

      {/* Search and Filter Section */}
      <motion.div variants={itemVariants}>
      <Card className="card-hover no-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search students by name, ID, or course..."
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
                  <option value="all">All Students</option>
                  <option value="graded">Graded</option>
                  <option value="pending">Pending</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
                <Button variant="outline" className="liquid-button">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Students List */}
      <motion.div variants={itemVariants}>
        <div className="space-y-4">
          {filteredStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    duration: 0.6,
                    delay: index * 0.05,
                    ease: [0.23, 1, 0.32, 1]
                  }
                }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="liquid-hover"
              >
                <Card className={`card-hover border-0 shadow-sm ${
                  student.status === 'Pending' ? 'bg-yellow-50/30 border-l-4 border-l-orange-400' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="h-12 w-12 avatar-enhanced">
                          <AvatarImage src={student.avatar} alt={student.name} />
                          <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-500">
                            {student.studentId} • {student.course}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 flex-shrink-0">
                        <Badge className={`${getStatusColor(student.status)} text-xs`}>
                          {student.status}
                        </Badge>
                        <div className="w-24">
                           <Input
                              type="number"
                              placeholder="Grade"
                              value={student.grade}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="text-center font-semibold liquid-morph"
                           />
                        </div>
                        <Button 
                          size="sm" 
                          className="gradient-primary text-white liquid-button"
                          onClick={() => console.log(`Saving grade for ${student.name}`)}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="liquid-button">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGradeChange(student.id, '')}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Clear Grade
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Button className="gradient-primary text-white liquid-button">
            Add New Student
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Grades;