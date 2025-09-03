import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Eye,
  Download,
  CalendarDays,
  BookOpen,
  User
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

const Schedule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const scheduleItems = [
    {
      id: 1,
      title: 'Advanced Mathematics',
      instructor: 'Dr. Sarah Johnson',
      time: '09:00 - 10:30',
      duration: '1h 30m',
      room: 'Room A-101',
      students: 45,
      maxStudents: 50,
      date: '2024-01-22',
      day: 'Monday',
      type: 'lecture',
      status: 'scheduled',
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Computer Science Lab',
      instructor: 'Prof. Michael Chen',
      time: '11:00 - 12:30',
      duration: '1h 30m',
      room: 'Lab B-205',
      students: 30,
      maxStudents: 35,
      date: '2024-01-22',
      day: 'Monday',
      type: 'lab',
      status: 'scheduled',
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Digital Marketing Workshop',
      instructor: 'Emily Davis',
      time: '14:00 - 15:30',
      duration: '1h 30m',
      room: 'Room C-302',
      students: 25,
      maxStudents: 30,
      date: '2024-01-22',
      day: 'Monday',
      type: 'workshop',
      status: 'scheduled',
      color: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Data Analytics Seminar',
      instructor: 'James Wilson',
      time: '10:00 - 11:30',
      duration: '1h 30m',
      room: 'Room A-203',
      students: 40,
      maxStudents: 45,
      date: '2024-01-23',
      day: 'Tuesday',
      type: 'seminar',
      status: 'scheduled',
      color: 'bg-orange-500'
    },
    {
      id: 5,
      title: 'Creative Writing Class',
      instructor: 'Lisa Anderson',
      time: '13:00 - 14:30',
      duration: '1h 30m',
      room: 'Room D-104',
      students: 20,
      maxStudents: 25,
      date: '2024-01-23',
      day: 'Tuesday',
      type: 'class',
      status: 'scheduled',
      color: 'bg-pink-500'
    },
    {
      id: 6,
      title: 'Web Development Bootcamp',
      instructor: 'David Brown',
      time: '15:00 - 17:00',
      duration: '2h',
      room: 'Lab C-301',
      students: 35,
      maxStudents: 40,
      date: '2024-01-24',
      day: 'Wednesday',
      type: 'bootcamp',
      status: 'cancelled',
      color: 'bg-red-500'
    }
  ];

  const stats = [
    {
      title: 'Total Classes',
      value: '156',
      change: '+8.2%',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'This Week',
      value: '24',
      change: '+12.5%',
      icon: CalendarDays,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Active Rooms',
      value: '18',
      change: '+5.1%',
      icon: MapPin,
      color: 'text-[var(--dominant-red)]',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Instructors',
      value: '42',
      change: '+3.2%',
      icon: User,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800';
      case 'lab':
        return 'bg-green-100 text-green-800';
      case 'workshop':
        return 'bg-purple-100 text-purple-800';
      case 'seminar':
        return 'bg-orange-100 text-orange-800';
      case 'class':
        return 'bg-pink-100 text-pink-800';
      case 'bootcamp':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSchedule = scheduleItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.room.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getScheduleForDay = (day) => {
    return filteredSchedule.filter(item => item.day === day);
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
                <Calendar className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Schedule Management
              </h1>
              <p className="text-gray-600 text-lg">
                Organize and manage class schedules, rooms, and timetables.
              </p>
            </div>
            <Button className="gradient-primary text-white liquid-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
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

      {/* Controls Section */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="liquid-button"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900">January 2024</h3>
                  <p className="text-sm text-gray-500">Week 3</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="liquid-button"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search schedules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 liquid-morph"
                  />
                </div>
                
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedView('day')}
                    className={`px-4 py-2 text-sm font-medium liquid-morph ${
                      selectedView === 'day' 
                        ? 'bg-[var(--dominant-red)] text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setSelectedView('week')}
                    className={`px-4 py-2 text-sm font-medium liquid-morph ${
                      selectedView === 'week' 
                        ? 'bg-[var(--dominant-red)] text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setSelectedView('month')}
                    className={`px-4 py-2 text-sm font-medium liquid-morph ${
                      selectedView === 'month' 
                        ? 'bg-[var(--dominant-red)] text-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Month
                  </button>
                </div>

                <Button variant="outline" className="liquid-button">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule Grid */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-6 border-b border-gray-200">
              <div className="p-4 bg-gray-50 border-r border-gray-200">
                <span className="text-sm font-medium text-gray-600">Time</span>
              </div>
              {weekDays.map((day) => (
                <div key={day} className="p-4 bg-gray-50 border-r border-gray-200 last:border-r-0">
                  <span className="text-sm font-medium text-gray-900">{day}</span>
                  <p className="text-xs text-gray-500">Jan {20 + weekDays.indexOf(day)}</p>
                </div>
              ))}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-6 border-b border-gray-100 last:border-b-0">
                  <div className="p-4 border-r border-gray-200 bg-gray-50">
                    <span className="text-sm font-medium text-gray-600">{time}</span>
                  </div>
                  {weekDays.map((day) => {
                    const daySchedule = getScheduleForDay(day).filter(item => 
                      item.time.startsWith(time)
                    );
                    
                    return (
                      <div key={`${day}-${time}`} className="p-2 border-r border-gray-200 last:border-r-0 min-h-[80px]">
                        {daySchedule.map((item) => (
                          <motion.div
                            key={item.id}
                            className={`${item.color} text-white p-2 rounded-lg mb-2 cursor-pointer liquid-morph`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-medium truncate">{item.title}</h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-white hover:bg-white/20">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Schedule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Class
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-xs opacity-90">{item.instructor}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs opacity-90">{item.room}</span>
                              <span className="text-xs opacity-90">{item.students}/{item.maxStudents}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Classes */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Upcoming Classes</CardTitle>
            <CardDescription>Next scheduled classes and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSchedule.slice(0, 4).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: {
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: [0.23, 1, 0.32, 1]
                    }
                  }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 liquid-morph"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.instructor} • {item.room}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{item.time}</p>
                      <p className="text-xs text-gray-500">{item.day}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getTypeColor(item.type)} text-xs`}>
                        {item.type}
                      </Badge>
                      <Badge className={`${getStatusColor(item.status)} text-xs`}>
                        {item.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                      {item.students}/{item.maxStudents}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Empty State */}
      {filteredSchedule.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search criteria or create a new schedule.</p>
          <Button className="gradient-primary text-white liquid-button">
            <Plus className="w-4 h-4 mr-2" />
            Create First Schedule
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Schedule;

