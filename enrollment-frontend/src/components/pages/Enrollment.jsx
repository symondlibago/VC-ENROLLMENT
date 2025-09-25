import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Search, Filter, MoreVertical, Eye, Edit, Trash2, FileText,
  AlertCircle, CheckCircle, XCircle, Calendar, Mail, User, Book,
  CreditCard, // For the new toggle
  Receipt,    // For the new toggle
} from 'lucide-react';
import { enrollmentAPI, authAPI, uploadReceiptAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StudentDetailsModal from '../modals/StudentDetailsModal';
import { toast } from 'sonner';

// --- MAIN ENROLLMENT COMPONENT (Handles state and layout) ---
const Enrollment = () => {
  const [activeView, setActiveView] = useState('enrollments');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [enrollments, setEnrollments] = useState([]);
  const [receipts, setReceipts] = useState([]);
  
  // Modal states
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const currentUser = authAPI.getUserData();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const enrollmentsPromise = enrollmentAPI.getPreEnrolledStudents();
        const receiptsPromise = (currentUser.role === 'Cashier' || currentUser.role === 'Admin') 
          ? uploadReceiptAPI.getAll() 
          : Promise.resolve({ success: true, data: [] });

        const [enrollmentsRes, receiptsRes] = await Promise.all([enrollmentsPromise, receiptsPromise]);
        
        if (enrollmentsRes.success) {
          setEnrollments(enrollmentsRes.data);
        } else {
          toast.error("Failed to load enrollment data.");
        }
        
        if (receiptsRes.success) {
          setReceipts(receiptsRes.data);
        } else {
          toast.error("Failed to load receipt data.");
        }

      } catch (error) {
        toast.error('An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser.role]);

  const handleViewDetails = (studentId) => {
    setSelectedStudentId(studentId);
    setIsDetailsModalOpen(true);
  };
  
  const handleViewImage = (imageUrl) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  const enrollmentStats = useMemo(() => {
      const total = enrollments.length;
      const pending = enrollments.filter(e => e.status.includes('Review') || e.status.includes('Pending')).length;
      const approved = enrollments.filter(e => e.status === 'Enrolled').length;
      const rejected = enrollments.filter(e => e.status === 'Rejected').length;
      return { total, pending, approved, rejected };
  }, [enrollments]);

  const stats = useMemo(() => [
    { title: 'Total Enrollments', value: enrollmentStats.total, icon: GraduationCap, color: 'text-blue-600' },
    { title: 'Pending Approval', value: enrollmentStats.pending, icon: AlertCircle, color: 'text-yellow-600' },
    { title: 'Enrolled Students', value: enrollmentStats.approved, icon: CheckCircle, color: 'text-green-600' },
    { title: 'Uploaded Receipts', value: receipts.length, icon: Receipt, color: 'text-purple-600' }
  ], [enrollmentStats, receipts]);
  
  const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };

  const isCashierOrAdmin = currentUser.role === 'Cashier' || currentUser.role === 'Admin';
  
  const pageTitle = isCashierOrAdmin ? "Cashier Dashboard" : "Enrollment Management";
  const pageDescription = isCashierOrAdmin 
    ? "Manage student enrollments and process uploaded payment receipts."
    : "Process and manage student course enrollments and registrations.";


  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="gradient-soft rounded-2xl p-8 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold heading-bold text-gray-900 flex items-center">
              {isCashierOrAdmin ? 
                <CreditCard className="w-8 h-8 text-[var(--dominant-red)] mr-3" /> :
                <GraduationCap className="w-8 h-8 text-[var(--dominant-red)] mr-3" />
              }
              {pageTitle}
            </h1>
            <p className="text-gray-600">{pageDescription}</p>
          </div>
          {isCashierOrAdmin && (
            <div className="relative bg-gray-100 rounded-2xl p-1 inline-flex">
              <motion.div
                className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md"
                animate={{
                  left: activeView === 'enrollments' ? '4px' : '50%',
                  right: activeView === 'enrollments' ? '50%' : '4px',
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button onClick={() => setActiveView('enrollments')} className={`relative z-10 p-3 rounded-xl transition-colors ${activeView === 'enrollments' ? 'text-[var(--dominant-red)]' : 'text-gray-600'}`} title="Enrollments"><GraduationCap className="w-5 h-5" /></button>
              <button onClick={() => setActiveView('receipts')} className={`relative z-10 p-3 rounded-xl transition-colors ${activeView === 'receipts' ? 'text-[var(--dominant-red)]' : 'text-gray-600'}`} title="Receipts"><Receipt className="w-5 h-5" /></button>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <Card key={stat.title} className="card-hover">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold heading-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color.split('-')[1]}-50`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={activeView} variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {(isCashierOrAdmin && activeView === 'receipts') ? (
              <UploadedReceiptsPage 
                receipts={receipts} 
                onViewImage={handleViewImage} 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            ) : (
              <EnrollmentListPage 
                enrollments={enrollments} 
                onViewDetails={handleViewDetails} 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
      
      {/* Modals */}
      {isDetailsModalOpen && (
        <StudentDetailsModal studentId={selectedStudentId} isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} currentUserRole={currentUser?.role} />
      )}
      {isImageModalOpen && (
        <ImageZoomModal isOpen={isImageModalOpen} onClose={() => setIsImageModalOpen(false)} imageUrl={selectedImageUrl} />
      )}
    </div>
  );
};

// --- SUB-COMPONENT FOR ENROLLMENT LIST (YOUR ORIGINAL TABLE) ---
const EnrollmentListPage = ({ enrollments, onViewDetails, searchTerm, setSearchTerm, selectedFilter, setSelectedFilter }) => {
  const filteredEnrollments = useMemo(() => enrollments.filter(enrollment => {
      const name = enrollment.name || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (enrollment.email && enrollment.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (enrollment.course && enrollment.course.toLowerCase().includes(searchTerm.toLowerCase()));
      if (selectedFilter === 'all') return matchesSearch;
      let statusMatch = false;
      if (selectedFilter === 'pending') statusMatch = (enrollment.status.includes('Review') || enrollment.status.includes('Payment'));
      else if (selectedFilter === 'enrolled') statusMatch = (enrollment.status === 'Enrolled');
      else if (selectedFilter === 'rejected') statusMatch = (enrollment.status === 'Rejected');
      return matchesSearch && statusMatch;
  }), [enrollments, searchTerm, selectedFilter]);

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    status = status.toLowerCase();
    if (status.includes('enrolled')) return 'bg-green-100 text-green-800';
    if (status.includes('pending') || status.includes('review')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('rejected')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Enrolled': return <CheckCircle className="w-4 h-4 mr-2" />;
      case 'Program Head Review':
      case 'Registrar Review':
      case 'Pending Payment': return <AlertCircle className="w-4 h-4 mr-2" />;
      case 'Rejected': return <XCircle className="w-4 h-4 mr-2" />;
      default: return <AlertCircle className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card><CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input 
              placeholder="Search by name, email, or course..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </div>
      </CardContent></Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Enrollment Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.length > 0 ? filteredEnrollments.map(e => (
              <TableRow key={e.id} className="hover:bg-red-50/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-red-100 text-red-800 font-bold">{e.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-2 text-red-800" />
                        <p className="font-bold text-gray-900">{e.name}</p>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-2 text-red-800" />
                        <p className="text-sm text-gray-500">{e.email}</p>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center font-medium text-gray-800">
                    <GraduationCap className="w-4 h-4 mr-2 text-red-800 flex-shrink-0" />
                    <span>{e.course || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Book className="w-3 h-3 mr-2 text-red-800 flex-shrink-0" />
                    <span>Program: {e.program || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-red-800" />
                    <span>{e.enrollment_date}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(e.status)} font-medium`}>
                    {getStatusIcon(e.status)}
                    {e.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(e.id)}>
                        <Eye size={14} className="mr-2" />View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No enrollments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// --- SUB-COMPONENT FOR UPLOADED RECEIPTS ---
const UploadedReceiptsPage = ({ receipts, onViewImage, searchTerm, setSearchTerm }) => {
  const filteredReceipts = useMemo(() => receipts.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.studentIdNumber.includes(searchTerm)
  ), [receipts, searchTerm]);

  return (
    <div className="space-y-6">
      <Card><CardContent className="p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Search by student name or ID..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="pl-10" 
          />
        </div>
      </CardContent></Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Upload Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.length > 0 ? filteredReceipts.map(r => (
              <TableRow key={r.id}>
                <TableCell>
                  <Avatar className="h-10 w-10 rounded-md cursor-pointer hover:scale-110 transition-transform" onClick={() => onViewImage(r.receiptUrl)}>
                    <AvatarImage src={r.receiptUrl} alt="Receipt" className="object-cover" />
                    <AvatarFallback className="rounded-md bg-gray-200">IMG</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{r.studentName}</TableCell>
                <TableCell>{r.studentIdNumber}</TableCell>
                <TableCell>{r.uploadDate}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No receipts uploaded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// --- HELPER COMPONENT FOR LOADING SPINNER ---
const LoadingSpinner = () => (
  <div className="text-center py-12">
    <motion.div 
      className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--dominant-red)] mx-auto"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <p className="mt-4 text-gray-500">Loading data...</p>
  </div>
);

// --- HELPER COMPONENT FOR IMAGE ZOOM MODAL ---
const ImageZoomModal = ({ isOpen, onClose, imageUrl }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      >
        <motion.img
          initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.5, y: 50 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          src={imageUrl} alt="Receipt Zoomed"
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={e => e.stopPropagation()} // Prevent closing when clicking on the image
        />
        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full"><XCircle /></button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default Enrollment;