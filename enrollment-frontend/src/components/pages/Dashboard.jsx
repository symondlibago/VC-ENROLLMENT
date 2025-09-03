import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Students',
      value: '2,847',
      change: '+12.5%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Courses',
      value: '156',
      change: '+8.2%',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'New Enrollments',
      value: '324',
      change: '+23.1%',
      icon: GraduationCap,
      color: 'text-[var(--dominant-red)]',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Completion Rate',
      value: '94.2%',
      change: '+5.4%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const recentEnrollments = [
    {
      id: 1,
      student: 'Sarah Johnson',
      course: 'Advanced Mathematics',
      date: '2024-01-15',
      status: 'completed',
      avatar: 'SJ'
    },
    {
      id: 2,
      student: 'Michael Chen',
      course: 'Computer Science Fundamentals',
      date: '2024-01-14',
      status: 'pending',
      avatar: 'MC'
    },
    {
      id: 3,
      student: 'Emily Davis',
      course: 'Digital Marketing',
      date: '2024-01-14',
      status: 'completed',
      avatar: 'ED'
    },
    {
      id: 4,
      student: 'James Wilson',
      course: 'Data Analytics',
      date: '2024-01-13',
      status: 'in-progress',
      avatar: 'JW'
    }
  ];

  const upcomingDeadlines = [
    {
      id: 1,
      title: 'Spring Semester Registration',
      date: '2024-02-01',
      daysLeft: 12,
      priority: 'high'
    },
    {
      id: 2,
      title: 'Course Material Submission',
      date: '2024-01-25',
      daysLeft: 5,
      priority: 'medium'
    },
    {
      id: 3,
      title: 'Student Assessment Review',
      date: '2024-01-30',
      daysLeft: 10,
      priority: 'low'
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
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <motion.div
      className="p-6 space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="animate-fade-in">
        <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold heading-bold text-gray-900 mb-2">
                Welcome back, Admin! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your enrollment system today.
              </p>
            </div>
            <Button className="gradient-primary text-white liquid-button">
              <Plus className="w-4 h-4 mr-2" />
              New Enrollment
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enrollments */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="card-hover border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold heading-bold">Recent Enrollments</CardTitle>
                  <CardDescription>Latest student registrations and their status</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="liquid-button">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEnrollments.map((enrollment) => (
                  <motion.div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 liquid-morph"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-[var(--dominant-red)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {enrollment.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{enrollment.student}</p>
                        <p className="text-sm text-gray-500">{enrollment.course}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getStatusColor(enrollment.status)} mb-1`}>
                        {enrollment.status}
                      </Badge>
                      <p className="text-xs text-gray-500">{enrollment.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold heading-bold">Upcoming Deadlines</CardTitle>
              <CardDescription>Important dates to remember</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline) => (
                  <motion.div
                    key={deadline.id}
                    className={`p-4 rounded-xl border-l-4 bg-gray-50 ${getPriorityColor(deadline.priority)} liquid-morph`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{deadline.title}</h4>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{deadline.date}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        {deadline.daysLeft} days left
                      </span>
                      <Progress value={(30 - deadline.daysLeft) / 30 * 100} className="w-16 h-2" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Quick Actions</CardTitle>
            <CardDescription>Frequently used enrollment system functions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, label: 'Add Student', color: 'bg-blue-50 text-blue-600' },
                { icon: BookOpen, label: 'Create Course', color: 'bg-green-50 text-green-600' },
                { icon: GraduationCap, label: 'Process Enrollment', color: 'bg-red-50 text-[var(--dominant-red)]' },
                { icon: Calendar, label: 'Schedule Class', color: 'bg-purple-50 text-purple-600' }
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    className="p-6 rounded-xl border border-gray-200 hover:border-[var(--dominant-red)] liquid-morph text-center group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 liquid-morph`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{action.label}</p>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;

