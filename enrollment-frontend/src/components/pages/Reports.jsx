import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Eye,
  Share,
  FileText,
  PieChart,
  LineChart,
  Activity
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

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const reports = [
    {
      id: 1,
      title: 'Student Enrollment Analytics',
      description: 'Comprehensive analysis of student enrollment trends and patterns',
      category: 'enrollment',
      type: 'analytics',
      lastUpdated: '2024-01-20',
      status: 'ready',
      size: '2.4 MB',
      views: 156,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Course Performance Report',
      description: 'Detailed performance metrics for all active courses',
      category: 'academic',
      type: 'performance',
      lastUpdated: '2024-01-19',
      status: 'ready',
      size: '1.8 MB',
      views: 89,
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      id: 3,
      title: 'Financial Summary Q1 2024',
      description: 'Quarterly financial overview and revenue analysis',
      category: 'financial',
      type: 'summary',
      lastUpdated: '2024-01-18',
      status: 'processing',
      size: '3.2 MB',
      views: 234,
      icon: BarChart3,
      color: 'bg-purple-500'
    },
    {
      id: 4,
      title: 'Instructor Workload Analysis',
      description: 'Analysis of teaching loads and resource allocation',
      category: 'staff',
      type: 'workload',
      lastUpdated: '2024-01-17',
      status: 'ready',
      size: '1.5 MB',
      views: 67,
      icon: GraduationCap,
      color: 'bg-orange-500'
    },
    {
      id: 5,
      title: 'Student Satisfaction Survey',
      description: 'Results from the latest student feedback and satisfaction survey',
      category: 'feedback',
      type: 'survey',
      lastUpdated: '2024-01-16',
      status: 'ready',
      size: '4.1 MB',
      views: 198,
      icon: Activity,
      color: 'bg-pink-500'
    },
    {
      id: 6,
      title: 'Attendance Tracking Report',
      description: 'Monthly attendance patterns and trends analysis',
      category: 'attendance',
      type: 'tracking',
      lastUpdated: '2024-01-15',
      status: 'scheduled',
      size: '2.7 MB',
      views: 123,
      icon: Calendar,
      color: 'bg-red-500'
    }
  ];

  const stats = [
    {
      title: 'Total Reports',
      value: '247',
      change: '+12.5%',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Generated This Month',
      value: '34',
      change: '+23.1%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Views',
      value: '12.4K',
      change: '+8.2%',
      icon: Eye,
      color: 'text-[var(--dominant-red)]',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Avg Response Time',
      value: '2.3s',
      change: '-15.4%',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const quickReports = [
    {
      title: 'Student Overview',
      description: 'Quick snapshot of student metrics',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      action: 'Generate'
    },
    {
      title: 'Course Analytics',
      description: 'Performance data for all courses',
      icon: BookOpen,
      color: 'bg-green-50 text-green-600',
      action: 'Generate'
    },
    {
      title: 'Revenue Report',
      description: 'Financial performance summary',
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-600',
      action: 'Generate'
    },
    {
      title: 'Attendance Summary',
      description: 'Class attendance overview',
      icon: Calendar,
      color: 'bg-orange-50 text-orange-600',
      action: 'Generate'
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
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'enrollment':
        return 'bg-blue-100 text-blue-800';
      case 'academic':
        return 'bg-green-100 text-green-800';
      case 'financial':
        return 'bg-purple-100 text-purple-800';
      case 'staff':
        return 'bg-orange-100 text-orange-800';
      case 'feedback':
        return 'bg-pink-100 text-pink-800';
      case 'attendance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
                <BarChart3 className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Reports & Analytics
              </h1>
              <p className="text-gray-600 text-lg">
                Generate insights and track performance with comprehensive reporting tools.
              </p>
            </div>
            <Button className="gradient-primary text-white liquid-button">
              <Plus className="w-4 h-4 mr-2" />
              Create Report
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
                      <div className="flex items-center mt-1">
                        {stat.change.startsWith('+') ? (
                          <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <p className={`text-sm font-medium ${
                          stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </p>
                      </div>
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

      {/* Quick Reports */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Quick Reports</CardTitle>
            <CardDescription>Generate common reports instantly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickReports.map((report, index) => {
                const Icon = report.icon;
                return (
                  <motion.button
                    key={report.title}
                    className="p-6 rounded-xl border border-gray-200 hover:border-[var(--dominant-red)] liquid-morph text-left group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-12 h-12 rounded-xl ${report.color} flex items-center justify-center mb-4 group-hover:scale-110 liquid-morph`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{report.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                    <Button size="sm" className="gradient-primary text-white liquid-button w-full">
                      {report.action}
                    </Button>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
                    placeholder="Search reports by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 liquid-morph"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph"
                >
                  <option value="all">All Categories</option>
                  <option value="enrollment">Enrollment</option>
                  <option value="academic">Academic</option>
                  <option value="financial">Financial</option>
                  <option value="staff">Staff</option>
                  <option value="feedback">Feedback</option>
                  <option value="attendance">Attendance</option>
                </select>
                <Button variant="outline" className="liquid-button">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" className="liquid-button">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reports Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report, index) => {
            const Icon = report.icon;
            return (
              <motion.div
                key={report.id}
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
                <Card className="card-hover border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${report.color} text-white`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="liquid-button">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Report
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mb-4">
                      <h3 className="font-bold text-gray-900 mb-2">{report.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <Badge className={`${getCategoryColor(report.category)} text-xs`}>
                        {report.category}
                      </Badge>
                      <Badge className={`${getStatusColor(report.status)} text-xs`}>
                        {report.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last Updated</span>
                        <span className="font-medium">{report.lastUpdated}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>File Size</span>
                        <span className="font-medium">{report.size}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Views</span>
                        <span className="font-medium">{report.views}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1 gradient-primary text-white liquid-button"
                          disabled={report.status !== 'ready'}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="liquid-button"
                          disabled={report.status !== 'ready'}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="liquid-button"
                        >
                          <Share className="w-4 h-4" />
                        </Button>
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
      {filteredReports.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Button className="gradient-primary text-white liquid-button">
            <Plus className="w-4 h-4 mr-2" />
            Create First Report
          </Button>
        </motion.div>
      )}

      {/* Chart Placeholder */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Analytics Overview</CardTitle>
            <CardDescription>Key performance indicators and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Interactive charts and visualizations</p>
                <p className="text-sm text-gray-400">Coming soon with advanced analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Reports;

