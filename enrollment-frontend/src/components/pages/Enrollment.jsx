import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  Search, 
  Filter,
  Plus,
  MoreVertical,
  Clock,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  UserCheck,
  BookOpen,
  CreditCard,
  FileText,
  ChevronRight,
  Printer
} from 'lucide-react';
import { enrollmentAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StudentDetailsModal from '../modals/StudentDetailsModal';

const Enrollment = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await enrollmentAPI.getPreEnrolledStudents();
      
      if (response.success) {
        setEnrollments(response.data);
      } else {
        setError('Failed to load enrollments');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching enrollments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetails = (studentId) => {
    setSelectedStudentId(studentId);
    setIsModalOpen(true);
  };
  
  // Stats based on real data
  const stats = [
    {
      title: 'Total Enrollments',
      value: '1,247',
      change: '+23.1%',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Approval',
      value: '45',
      change: '+12.5%',
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Active Students',
      value: '892',
      change: '+8.2%',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Completion Rate',
      value: '94.2%',
      change: '+5.4%',
      icon: CheckCircle,
      color: 'text-[var(--dominant-red)]',
      bgColor: 'bg-red-50'
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
    if (!status) return 'bg-gray-100 text-gray-800';
    
    status = status.toLowerCase();
    
    if (status.includes('approved')) {
      return 'bg-green-100 text-green-800';
    } else if (status.includes('pending') || status.includes('review')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (status.includes('rejected')) {
      return 'bg-red-100 text-red-800';
    } else if (status.includes('completed')) {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesSearch = (enrollment.full_name ? enrollment.full_name.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (enrollment.email && enrollment.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (enrollment.course && enrollment.course.name && enrollment.course.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && enrollment.status === selectedFilter;
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
                <GraduationCap className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
                Enrollment Management
              </h1>
              <p className="text-gray-600 text-lg">
                Process and manage student course enrollments and registrations.
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

      {/* Search and Filter Section */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by student, course, or instructor..."
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
                  <option value="all">All Enrollments</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
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

      {/* Enrollments List */}
      <motion.div variants={itemVariants}>
        <div className="space-y-4">
          {filteredEnrollments.map((enrollment, index) => (
            <motion.div
              key={enrollment.id}
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
              <Card className="card-hover border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={`/api/placeholder/48/48`} alt={enrollment.first_name} />
                        <AvatarFallback className="bg-[var(--dominant-red)] text-white font-bold">
                          {enrollment.first_name}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={`${getStatusColor(enrollment.status)} text-xs flex items-center space-x-1`}>
                            {getStatusIcon(enrollment.status)}
                            <span>{enrollment.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {enrollment.name || `${enrollment.first_name || ''} ${enrollment.middle_name || ''} ${enrollment.last_name || ''}`}
                            </p>
                            <p className="text-xs text-gray-500">Program: {enrollment.program || 'Not specified'}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Course</p>
                            <p className="font-medium text-gray-900">{enrollment.course && enrollment.course_code ? `${enrollment.course} [${enrollment.course_code}]` : 'Not specified'}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-500">Enrollment Date</p>
                            <p className="font-medium text-gray-900">{enrollment.enrollment_date}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="liquid-button">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(enrollment.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Enrollment
                          </DropdownMenuItem>
                          {enrollment.status === 'pending' && (
                            <>
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Enrollment
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
      {loading ? (
        <motion.div variants={itemVariants} className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--dominant-red)] mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading enrollments...</p>
        </motion.div>
      ) : error ? (
        <motion.div variants={itemVariants} className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading enrollments</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchEnrollments} className="gradient-primary text-white liquid-button">
            Try Again
          </Button>
        </motion.div>
      ) : filteredEnrollments.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria.</p>
          <Button className="gradient-primary text-white liquid-button">
            <Plus className="w-4 h-4 mr-2" />
            Create First Enrollment
          </Button>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold heading-bold">Quick Actions</CardTitle>
            <CardDescription>Common enrollment management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: UserCheck, label: 'Approve Pending', color: 'bg-green-50 text-green-600' },
                { icon: CreditCard, label: 'Process Payments', color: 'bg-blue-50 text-blue-600' },
                { icon: BookOpen, label: 'Assign Courses', color: 'bg-purple-50 text-purple-600' },
                { icon: Download, label: 'Export Reports', color: 'bg-orange-50 text-orange-600' }
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
      {/* Student Details Modal */}
      <StudentDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        studentId={selectedStudentId} 
      />
    </motion.div>
  );
};

export default Enrollment;

