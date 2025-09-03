import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Clock,
  Users,
  Calendar,
  Star,
  Edit,
  Trash2,
  Eye,
  Download,
  Play,
  BookMarked,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const courses = [
    {
      id: 1,
      title: 'Advanced Mathematics',
      description: 'Comprehensive course covering calculus, linear algebra, and statistics',
      instructor: 'Dr. Sarah Johnson',
      duration: '12 weeks',
      students: 45,
      maxStudents: 50,
      startDate: '2024-02-01',
      status: 'active',
      category: 'Mathematics',
      rating: 4.8,
      progress: 65,
      price: '$299',
      image: '/api/placeholder/300/200'
    },
    {
      id: 2,
      title: 'Computer Science Fundamentals',
      description: 'Introduction to programming, algorithms, and data structures',
      instructor: 'Prof. Michael Chen',
      duration: '16 weeks',
      students: 38,
      maxStudents: 40,
      startDate: '2024-01-15',
      status: 'active',
      category: 'Technology',
      rating: 4.9,
      progress: 80,
      price: '$399',
      image: '/api/placeholder/300/200'
    },
    {
      id: 3,
      title: 'Digital Marketing Strategy',
      description: 'Modern marketing techniques and digital advertising strategies',
      instructor: 'Emily Davis',
      duration: '8 weeks',
      students: 32,
      maxStudents: 35,
      startDate: '2024-02-15',
      status: 'upcoming',
      category: 'Business',
      rating: 4.7,
      progress: 0,
      price: '$249',
      image: '/api/placeholder/300/200'
    },
    {
      id: 4,
      title: 'Data Analytics & Visualization',
      description: 'Learn to analyze data and create meaningful visualizations',
      instructor: 'James Wilson',
      duration: '10 weeks',
      students: 28,
      maxStudents: 30,
      startDate: '2024-01-20',
      status: 'active',
      category: 'Data Science',
      rating: 4.6,
      progress: 45,
      price: '$349',
      image: '/api/placeholder/300/200'
    },
    {
      id: 5,
      title: 'Creative Writing Workshop',
      description: 'Develop your writing skills and creative expression',
      instructor: 'Lisa Anderson',
      duration: '6 weeks',
      students: 20,
      maxStudents: 25,
      startDate: '2024-01-10',
      status: 'completed',
      category: 'Arts',
      rating: 4.5,
      progress: 100,
      price: '$199',
      image: '/api/placeholder/300/200'
    },
    {
      id: 6,
      title: 'Web Development Bootcamp',
      description: 'Full-stack web development with modern frameworks',
      instructor: 'David Brown',
      duration: '20 weeks',
      students: 42,
      maxStudents: 45,
      startDate: '2024-02-01',
      status: 'active',
      category: 'Technology',
      rating: 4.9,
      progress: 30,
      price: '$499',
      image: '/api/placeholder/300/200'
    }
  ];

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
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || course.status === selectedFilter;
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
                <BookOpen className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Courses Management
              </h1>
              <p className="text-gray-600 text-lg">
                Create, manage, and monitor all educational courses and programs.
              </p>
            </div>
            <Button className="gradient-primary text-white liquid-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
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

      {/* Search and Filter Section */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search courses by title, instructor, or category..."
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
                  <option value="all">All Courses</option>
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

      {/* Courses Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
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
              <Card className="card-hover border-0 shadow-sm overflow-hidden">
                {/* Course Image */}
                <div className="h-48 bg-gradient-to-br from-[var(--dominant-red)] to-red-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-4 left-4">
                    <Badge className={`${getCategoryColor(course.category)} text-xs`}>
                      {course.category}
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
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1">{course.title}</h3>
                    <p className="text-white/80 text-sm">{course.instructor}</p>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`${getStatusColor(course.status)} text-xs`}>
                      {course.status}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-700">{course.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {course.duration}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        {course.students}/{course.maxStudents}
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      Starts: {course.startDate}
                    </div>

                    {course.status === 'active' && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[var(--dominant-red)]">
                        {course.price}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="liquid-button">
                          <BookMarked className="w-4 h-4" />
                        </Button>
                        <Button size="sm" className="gradient-primary text-white liquid-button">
                          View Course
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

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Button className="gradient-primary text-white liquid-button">
            <Plus className="w-4 h-4 mr-2" />
            Create First Course
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Courses;

