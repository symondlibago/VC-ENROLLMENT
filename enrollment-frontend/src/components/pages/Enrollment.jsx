import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  Printer
} from 'lucide-react';
import { enrollmentAPI, authAPI } from '@/services/api'; // Import authAPI
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import StudentDetailsModal from '../modals/StudentDetailsModal';

// Custom Framer Motion Dropdown Component
const MotionDropdown = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    options.find(opt => opt.value === value) || { label: placeholder, value: '' }
  );

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-200 rounded-lg focus:border-[var(--dominant-red)] focus:ring-2 focus:ring-[var(--dominant-red)]/20 liquid-morph flex items-center justify-between min-w-[200px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-gray-900">{selectedOption.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ backgroundColor: '#f9fafb', x: 4 }}
              >
                <span className="text-gray-900">{option.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Enrollment = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get the current user's data from local storage
  const currentUser = authAPI.getUserData();

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

  const filterOptions = [
    { label: 'All Enrollments', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Completed', value: 'completed' }
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

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const name = enrollment.name || `${enrollment.first_name || ''} ${enrollment.last_name || ''}`.trim();

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (enrollment.email && enrollment.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (enrollment.course && enrollment.course.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedFilter === 'all') return matchesSearch;
    if (!enrollment.status) return false;
    
    const statusMatch = enrollment.status.toLowerCase().replace(/ /g, '').includes(selectedFilter);
    return matchesSearch && statusMatch;
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
              className="liquid-hover"
            >
              <Card className="card-hover border-0 shadow-sm overflow-hidden">
                <CardContent className="p-6 relative">
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <motion.p 
                        className="text-2xl font-bold heading-bold text-gray-900"
                        initial={{ scale: 1 }}
                      >
                        {stat.value}
                      </motion.p>
                      <p className="text-sm text-green-600 font-medium mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <motion.div 
                      className={`p-3 rounded-xl ${stat.bgColor}`}
                    >
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search and Filter Section - No Hover */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm no-hover">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Full Width Search Bar */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by student name, email, course, or instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base liquid-morph border-gray-200 focus:border-[var(--dominant-red)] focus:ring-2 focus:ring-[var(--dominant-red)]/20"
                  />
                </div>
              </div>
              
              {/* Filter and Action Buttons */}
              <div className="flex items-center space-x-3 flex-shrink-0">
                <MotionDropdown
                  value={selectedFilter}
                  onChange={setSelectedFilter}
                  options={filterOptions}
                  placeholder="Filter by status"
                />
                <Button variant="outline" className="liquid-button">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filter
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
              className="liquid-hover"
            >
              <Card className="card-hover border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Enhanced Avatar */}
                      <motion.div>
                        <Avatar className="w-10 h-10 ring-1 ring-gray-100 ring-offset-1">
                          <AvatarImage 
                            src={enrollment.avatar || `/api/placeholder/56/56`} 
                            alt={enrollment.first_name || 'Student'} 
                          />
                          <AvatarFallback className="bg-gradient-to-br from-[var(--dominant-red)] to-red-600 text-white font-bold text-sm">
                            {getInitials(enrollment.first_name, enrollment.last_name)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>

                      <div className="flex-1">
                        
                        {/* Enhanced Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <motion.div
                            className="space-y-1"
                          >
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Student</p>
                            <p className="font-bold text-gray-900 text-base">
                              {enrollment.name || `${enrollment.first_name || ''} ${enrollment.middle_name || ''} ${enrollment.last_name || ''}`.trim() || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Program: {enrollment.program || 'Not specified'}
                            </p>
                          </motion.div>
                          
                          <motion.div
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-1"
                          >
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Course Details</p>
                            <p className="font-bold text-gray-900 text-base">
                              {enrollment.course || 'Course not assigned'}
                            </p>
                            <p className="text-xs text-gray-600">
                              Code: {enrollment.course_code || 'N/A'}
                            </p>
                            
                          </motion.div>
                          
                          <motion.div
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-1"
                          >
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Timeline</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <p className="font-medium text-gray-900">
                                  {enrollment.enrollment_date || 'Date not set'}
                                </p>
                              </div>
                              <motion.div>
                                <Badge className={`${getStatusColor(enrollment.status)} text-xs flex items-center space-x-1 px-2 py-1`}>
                                  {getStatusIcon(enrollment.status)}
                                  <span className="font-medium">{enrollment.status || 'Pending'}</span>
                                </Badge>
                              </motion.div>
                            </div>
                            
                            {enrollment.payment_status && (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Badge className={`${getPaymentStatusColor(enrollment.payment_status)} text-xs mt-2`}>
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  {enrollment.payment_status}
                                </Badge>
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Action Menu */}
                    <div className="flex items-center space-x-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button variant="ghost" size="sm" className="liquid-button h-10 w-10 rounded-full">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleViewDetails(enrollment.id)}>
                            <Eye className="mr-2 h-4 w-4 hover:text-white" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4 hover:text-white" />
                            Edit Enrollment
                          </DropdownMenuItem>
                          {enrollment.status === 'pending' && (
                            <>
                              <DropdownMenuItem className="text-green-600 ">
                                <CheckCircle className="mr-2 h-4 w-4 hover:text-white" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4 hover:text-white" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
                          </DropdownMenuItem>
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
          <motion.div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--dominant-red)] mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
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

      {/* Student Details Modal */}
      {isModalOpen && (
        <StudentDetailsModal
          studentId={selectedStudentId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentUserRole={currentUser?.role} // Pass the user role as a prop
        />
      )}
    </motion.div>
  );
};  

export default Enrollment;