import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Check,
  X,
  Eye,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Clock,
  User,
  Mail,
  MessageSquare,
  Calendar,
  BookOpen
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

const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const notifications = [
    {
      id: 1,
      title: 'New Student Enrollment',
      message: 'Sarah Johnson has enrolled in Advanced Mathematics course',
      type: 'enrollment',
      priority: 'medium',
      isRead: false,
      timestamp: '2024-01-22 10:30 AM',
      sender: 'System',
      action: 'Review Application',
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 2,
      title: 'Course Schedule Updated',
      message: 'Computer Science Lab schedule has been changed to Room B-205',
      type: 'schedule',
      priority: 'high',
      isRead: false,
      timestamp: '2024-01-22 09:15 AM',
      sender: 'Prof. Michael Chen',
      action: 'View Schedule',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 3,
      title: 'Payment Received',
      message: 'Payment of $299 received from Emily Davis for Digital Marketing course',
      type: 'payment',
      priority: 'low',
      isRead: true,
      timestamp: '2024-01-22 08:45 AM',
      sender: 'Payment System',
      action: 'View Receipt',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 4,
      title: 'System Maintenance Alert',
      message: 'Scheduled maintenance will occur tonight from 11 PM to 2 AM',
      type: 'system',
      priority: 'high',
      isRead: false,
      timestamp: '2024-01-21 06:00 PM',
      sender: 'IT Department',
      action: 'View Details',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 5,
      title: 'New Course Material Uploaded',
      message: 'Dr. Sarah Johnson uploaded new materials for Advanced Mathematics',
      type: 'content',
      priority: 'medium',
      isRead: true,
      timestamp: '2024-01-21 03:20 PM',
      sender: 'Dr. Sarah Johnson',
      action: 'View Materials',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 6,
      title: 'Student Inquiry',
      message: 'James Wilson sent a message regarding course prerequisites',
      type: 'message',
      priority: 'medium',
      isRead: false,
      timestamp: '2024-01-21 02:10 PM',
      sender: 'James Wilson',
      action: 'Reply',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 7,
      title: 'Enrollment Deadline Reminder',
      message: 'Spring semester enrollment deadline is approaching (3 days left)',
      type: 'reminder',
      priority: 'high',
      isRead: true,
      timestamp: '2024-01-21 12:00 PM',
      sender: 'System',
      action: 'View Enrollments',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      id: 8,
      title: 'Grade Report Generated',
      message: 'Monthly grade report for December 2023 is now available',
      type: 'report',
      priority: 'low',
      isRead: true,
      timestamp: '2024-01-21 10:30 AM',
      sender: 'Academic System',
      action: 'Download Report',
      icon: Info,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  const stats = [
    {
      title: 'Total Notifications',
      value: '247',
      change: '+12.5%',
      icon: Bell,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Unread',
      value: '23',
      change: '+8.2%',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'High Priority',
      value: '8',
      change: '+15.1%',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'This Week',
      value: '45',
      change: '+23.1%',
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'enrollment':
        return 'bg-blue-100 text-blue-800';
      case 'schedule':
        return 'bg-orange-100 text-orange-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'system':
        return 'bg-red-100 text-red-800';
      case 'content':
        return 'bg-purple-100 text-purple-800';
      case 'message':
        return 'bg-blue-100 text-blue-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'report':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.sender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'unread' && !notification.isRead) ||
                         (selectedFilter === 'read' && notification.isRead) ||
                         notification.priority === selectedFilter ||
                         notification.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const markAsRead = (id) => {
    // Implementation for marking notification as read
    console.log('Mark as read:', id);
  };

  const markAllAsRead = () => {
    // Implementation for marking all notifications as read
    console.log('Mark all as read');
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
                <Bell className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Notifications Center
              </h1>
              <p className="text-gray-600 text-lg">
                Stay updated with all system alerts, messages, and important announcements.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={markAllAsRead} className="liquid-button">
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
              <Button className="gradient-primary text-white liquid-button">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
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
                    placeholder="Search notifications by title, message, or sender..."
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
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                  <option value="enrollment">Enrollment</option>
                  <option value="schedule">Schedule</option>
                  <option value="payment">Payment</option>
                  <option value="system">System</option>
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

      {/* Notifications List */}
      <motion.div variants={itemVariants}>
        <div className="space-y-4">
          {filteredNotifications.map((notification, index) => {
            const Icon = notification.icon;
            return (
              <motion.div
                key={notification.id}
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
                className="liquid-hover"
              >
                <Card className={`card-hover border-0 shadow-sm ${
                  !notification.isRead ? 'bg-blue-50/30 border-l-4 border-l-[var(--dominant-red)]' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-3 rounded-xl ${notification.bgColor} flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${notification.color}`} />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`font-bold ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-[var(--dominant-red)] rounded-full"></div>
                            )}
                            <Badge className={`${getPriorityColor(notification.priority)} text-xs`}>
                              {notification.priority}
                            </Badge>
                            <Badge className={`${getTypeColor(notification.type)} text-xs`}>
                              {notification.type}
                            </Badge>
                          </div>
                          
                          <p className={`mb-3 ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{notification.sender}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{notification.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          className="gradient-primary text-white liquid-button"
                        >
                          {notification.action}
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="liquid-button">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.isRead && (
                              <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Button className="gradient-primary text-white liquid-button">
            <Settings className="w-4 h-4 mr-2" />
            Manage Notification Settings
          </Button>
        </motion.div>
      )}

      {/* Notification Settings */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Notification Preferences</CardTitle>
            <CardDescription>Customize how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { 
                  title: 'Email Notifications', 
                  description: 'Receive notifications via email',
                  icon: Mail,
                  enabled: true
                },
                { 
                  title: 'Push Notifications', 
                  description: 'Browser push notifications',
                  icon: Bell,
                  enabled: true
                },
                { 
                  title: 'SMS Alerts', 
                  description: 'High priority alerts via SMS',
                  icon: MessageSquare,
                  enabled: false
                }
              ].map((setting, index) => {
                const Icon = setting.icon;
                return (
                  <motion.div
                    key={setting.title}
                    className="p-4 rounded-xl border border-gray-200 hover:border-[var(--dominant-red)] liquid-morph"
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Icon className="w-6 h-6 text-[var(--dominant-red)]" />
                      <div className={`w-12 h-6 rounded-full ${
                        setting.enabled ? 'bg-[var(--dominant-red)]' : 'bg-gray-300'
                      } relative cursor-pointer liquid-morph`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          setting.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}></div>
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{setting.title}</h3>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Notifications;

