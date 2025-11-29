import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Clock,
  ArrowRight,
  AlertCircle,
  Calendar,
  CheckCircle,
  Hourglass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { enrollmentAPI, courseAPI, managementAPI } from '@/services/api';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    newEnrollments: 0,
    pendingApprovals: 0
  });
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch all data in parallel
        const [enrollmentsRes, coursesRes, periodsRes] = await Promise.all([
          enrollmentAPI.getPreEnrolledStudents(),
          courseAPI.getAll(),
          managementAPI.getGradingPeriods()
        ]);

        // 2. Process Enrollment Data
        if (enrollmentsRes.success) {
          const allStudents = enrollmentsRes.data;
          
          // Stats Calculation
          const enrolledStudents = allStudents.filter(s => s.status === 'Enrolled');
          const pendingStudents = allStudents.filter(s => 
            ['Pending Payment', 'Registrar Review', 'Program Head Review'].some(status => s.status.includes(status))
          );
          // "New Enrollments" where enrollment_type is 'New' (counting confirmed enrollments)
          const newTypeStudents = enrolledStudents.filter(s => s.enrollment_type === 'New');

          setStats(prev => ({
            ...prev,
            totalStudents: enrolledStudents.length,
            newEnrollments: newTypeStudents.length,
            pendingApprovals: pendingStudents.length
          }));

          // Recent Enrollments List (Top 5 Enrolled, sorted by date)
          // Assuming 'updated_at' or 'created_at' is the enrollment timestamp. 
          // If enrollment_date exists, use that.
          const sortedRecent = [...enrolledStudents]
            .sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
            .slice(0, 5)
            .map(student => ({
              id: student.id,
              student: student.name,
              course: student.course || 'N/A',
              status: student.status,
              avatar: student.name ? student.name.charAt(0).toUpperCase() : '?'
            }));
          
          setRecentEnrollments(sortedRecent);
        }

        // 3. Process Courses Data
        if (coursesRes.success) {
          setStats(prev => ({
            ...prev,
            activeCourses: coursesRes.data.length
          }));
        }

        // 4. Process Deadlines (Grading Periods & Enrollment)
        if (periodsRes.success) {
          const periods = periodsRes.data; // { prelim: {start_date, end_date}, ... }
          const deadlines = [];
          const now = new Date();

          // Helper to format deadline
          const addDeadline = (title, dateStr, type) => {
            if (!dateStr) return;
            const date = new Date(dateStr);
            // Only show future or today's deadlines
            if (date >= new Date(now.setHours(0,0,0,0))) {
              const diffTime = Math.abs(date - new Date());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              
              deadlines.push({
                id: title,
                title: title,
                date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                daysLeft: diffDays,
                priority: diffDays <= 3 ? 'high' : (diffDays <= 7 ? 'medium' : 'low'),
                type: type
              });
            }
          };

          // Check Enrollment Deadline
          if (periods.enrollment) {
            addDeadline('Enrollment Period Ends', periods.enrollment.end_date, 'Enrollment');
          }

          // Check Grading Submission Deadlines
          ['prelim', 'midterm', 'semifinal', 'final'].forEach(term => {
            if (periods[term]) {
              const formattedTerm = term.charAt(0).toUpperCase() + term.slice(1);
              addDeadline(`${formattedTerm} Grade Submission`, periods[term].end_date, 'Grading');
            }
          });

          // Sort by nearest deadline first
          deadlines.sort((a, b) => a.daysLeft - b.daysLeft);
          setUpcomingDeadlines(deadlines);
        }

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper functions for UI
  const getStatusColor = (status) => {
    switch (status) {
      case 'Enrolled': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

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
                Welcome back, Admin!
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your enrollment system today.
              </p>
            </div>
            {/* REMOVED: New Enrollment Button */}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Students */}
        <motion.div whileHover={{ scale: 1.02 }} className="liquid-hover">
          <Card className="card-hover border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                  <p className="text-2xl font-bold heading-bold text-gray-900">{stats.totalStudents}</p>
                  <p className="text-xs text-gray-500 mt-1">Enrolled</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 2: Active Courses */}
        <motion.div whileHover={{ scale: 1.02 }} className="liquid-hover">
          <Card className="card-hover border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Courses</p>
                  <p className="text-2xl font-bold heading-bold text-gray-900">{stats.activeCourses}</p>
                  <p className="text-xs text-gray-500 mt-1">Available Programs</p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 3: New Enrollments (Type: New) */}
        <motion.div whileHover={{ scale: 1.02 }} className="liquid-hover">
          <Card className="card-hover border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">New Enrollments</p>
                  <p className="text-2xl font-bold heading-bold text-gray-900">{stats.newEnrollments}</p>
                  <p className="text-xs text-gray-500 mt-1">Type: New Student</p>
                </div>
                <div className="p-3 rounded-xl bg-red-50">
                  <GraduationCap className="w-6 h-6 text-[var(--dominant-red)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Card 4: Pending Approvals (Replaces Completion Rate) */}
        <motion.div whileHover={{ scale: 1.02 }} className="liquid-hover">
          <Card className="card-hover border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Approvals</p>
                  <p className="text-2xl font-bold heading-bold text-gray-900">{stats.pendingApprovals}</p>
                  <p className="text-xs text-gray-500 mt-1">Action Required</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Hourglass className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
                  <CardDescription>Latest 5 enrolled students</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="liquid-button"
                  onClick={() => navigate('/enrollment')} // Navigates to Enrollment Page
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEnrollments.length > 0 ? (
                  recentEnrollments.map((enrollment) => (
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
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">No recent enrollments found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold heading-bold">Upcoming Deadlines</CardTitle>
              <CardDescription>Enrollment & Grade Submission Dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.length > 0 ? (
                  upcomingDeadlines.map((deadline) => (
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
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                    <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
                    <p>No upcoming deadlines.</p>
                  </div>
                )}
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
                { icon: Users, label: 'Add Student', color: 'bg-blue-50 text-blue-600', action: () => navigate('/enrollment') },
                { icon: BookOpen, label: 'Manage Courses', color: 'bg-green-50 text-green-600', action: () => navigate('/courses') },
                { icon: GraduationCap, label: 'Process Enrollment', color: 'bg-red-50 text-[var(--dominant-red)]', action: () => navigate('/enrollment') },
                { icon: Calendar, label: 'Grade Deadlines', color: 'bg-purple-50 text-purple-600', action: () => navigate('/grades') }
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    onClick={action.action}
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