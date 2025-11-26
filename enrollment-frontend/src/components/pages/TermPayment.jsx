import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Receipt, Search, MoreVertical, Eye,
    AlertCircle, CheckCircle, XCircle,
    CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { enrollmentAPI } from '@/services/api'; // Import enrollmentAPI
import TermPaymentModal from '../modals/TermPaymentModal'; // Import the new modal  
import SuccessAlert from '../modals/SuccessAlert';

// Helper function to get status color
const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    status = status.toLowerCase();
    if (status.includes('regular')) return 'bg-green-100 text-green-800';
    if (status.includes('irregular')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('withdraw')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
};

// Helper function to get status icon
const getStatusIcon = (status) => {
    if (!status) return <AlertCircle className="w-4 h-4 mr-2" />;
    status = status.toLowerCase();
    if (status.includes('regular')) return <CheckCircle className="w-4 h-4 mr-2" />;
    if (status.includes('irregular')) return <AlertCircle className="w-4 h-4 mr-2" />;
    if (status.includes('withdraw')) return <XCircle className="w-4 h-4 mr-2" />;
    return <AlertCircle className="w-4 h-4 mr-2" />;
};


// --- MAIN COMPONENT ---
const TermPayment = () => {
    const [students, setStudents] = useState([]); // Changed from 'payments'
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null); // Store student ID

    // ✅ 2. Add the alert state here
    const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });

    // Fetch enrolled students
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const response = await enrollmentAPI.getEnrolledStudents();
                if (response.success) {
                    setStudents(response.data);
                } else {
                    console.error("Failed to fetch students:", response.message);
                }
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const handleViewPayment = (studentId) => {
        setSelectedStudentId(studentId);
        setIsPaymentModalOpen(true);
    };

    const filteredStudents = useMemo(() => students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s.student_id_number.includes(searchTerm);
        return matchesSearch;
    }), [students, searchTerm]);

    const pageVariants = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <SuccessAlert 
                isVisible={alert.isVisible} 
                message={alert.message} 
                type={alert.type} 
                onClose={() => setAlert({ ...alert, isVisible: false })} 
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold heading-bold text-gray-900 flex items-center">
                        <CreditCard className="w-8 h-8 text-(--dominant-red) mr-3" />
                        Student Payments
                    </h1>
                    <p className="text-gray-600">Review and manage student payment records.</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="relative grow w-full border rounded-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input 
                            placeholder="Search by student name or ID..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="pl-10 rounded-lg" 
                        />
                    </div>
                </CardContent>
            </Card>


            {/* Content Area */}
            {loading ? (<LoadingSpinner />) : (
                <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Number</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Course</TableHead>
                                    <TableHead>Academic Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <div className="font-medium font-mono">{student.student_id_number}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium uppercase">{student.name}</div>
                                            <div className="text-sm text-gray-500">{student.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{student.courseName}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusColor(student.academic_status)} font-medium`}>
                                                {getStatusIcon(student.academic_status)}
                                                {student.academic_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                                                        <MoreVertical size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewPayment(student.id)}>
                                                        <Eye size={14} className="mr-2" />View Payment Info
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No enrolled students found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </motion.div>
            )}

            {/* Modals */}
            {isPaymentModalOpen && (
                <TermPaymentModal 
                    isOpen={isPaymentModalOpen} 
                    onClose={() => setIsPaymentModalOpen(false)} 
                    studentId={selectedStudentId}
                    
                    
                    onSaveSuccess={(message) => {
                        setIsPaymentModalOpen(false); // 1. Close the modal
                        setAlert({ isVisible: true, message: message, type: 'success' }); // 2. Show the alert
                    }}
                    onSaveError={(message) => {
                        // Show error alert, but keep the modal open
                        setAlert({ isVisible: true, message: message, type: 'error' });
                    }}
                />
            )}
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="text-center py-12">
        <motion.div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--dominant-red) mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-gray-500">Loading data...</p>
    </div>
);

export default TermPayment;