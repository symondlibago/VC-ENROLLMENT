import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, User, Book, Hash, PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { subjectChangeAPI } from '@/services/api';
import { toast } from 'sonner';

const SubjectChangeDetailsModal = ({ isOpen, onClose, requestDetails, currentUserRole, onStatusChange }) => {
    const [remarks, setRemarks] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setRemarks(''); // Reset remarks when a new request is opened
    }, [requestDetails]);

    if (!isOpen || !requestDetails) return null;

    const { student, items, status } = requestDetails;
    const addedSubjects = items.filter(item => item.action === 'add');
    const droppedSubjects = items.filter(item => item.action === 'drop');

    const handleProcessRequest = async (newStatus) => {
        setIsSaving(true);
        try {
            await subjectChangeAPI.processRequest(requestDetails.id, {
                status: newStatus,
                remarks: remarks,
            });
            toast.success(`Request has been ${newStatus}.`);
            onStatusChange(); // This will trigger a refresh in the parent component
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to process the request.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Determine if the current user can take action
    const canApprove = 
        (status === 'pending_program_head' && currentUserRole === 'Program Head') ||
        (status === 'pending_cashier' && currentUserRole === 'Cashier') ||
        currentUserRole === 'Admin';
    
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending_program_head': return <Badge variant="secondary">Pending Program Head</Badge>;
            case 'pending_cashier': return <Badge className="bg-yellow-100 text-yellow-800">Pending Cashier</Badge>;
            case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
            case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };
    
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-gray-50 z-10 flex items-center justify-between p-4 border-b">
                            <div>
                                <h2 className="text-xl font-semibold">Subject Change Details</h2>
                                {getStatusBadge(status)}
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose}><X size={20} /></Button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="border rounded-lg p-4">
                                <h3 className="font-semibold mb-2">Student Information</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <p className="flex items-center"><User size={14} className="mr-2 text-gray-500" /> <b>Name:</b> &nbsp;{student.last_name}, {student.first_name}</p>
                                    <p className="flex items-center"><Hash size={14} className="mr-2 text-gray-500" /> <b>ID Number:</b> &nbsp;{student.student_id_number}</p>
                                    <p className="flex items-center col-span-2"><Book size={14} className="mr-2 text-gray-500" /> <b>Course:</b> &nbsp;{student.course?.course_name}</p>
                                </div>
                            </div>
                            
                            {/* Added Subjects */}
                            {addedSubjects.length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2 text-green-600 flex items-center"><PlusCircle size={16} className="mr-2"/>Subjects to be Added</h3>
                                    <ul className="space-y-1 list-disc list-inside text-sm">
                                        {addedSubjects.map(item => <li key={item.id}>{item.subject.subject_code} - {item.subject.descriptive_title}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Dropped Subjects */}
                            {droppedSubjects.length > 0 && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="font-semibold mb-2 text-red-600 flex items-center"><MinusCircle size={16} className="mr-2"/>Subjects to be Dropped</h3>
                                    <ul className="space-y-1 list-disc list-inside text-sm">
                                        {droppedSubjects.map(item => <li key={item.id}>{item.subject.subject_code} - {item.subject.descriptive_title}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Approval Actions */}
                            {canApprove && (
                                <div className="border rounded-lg p-4 bg-gray-50">
                                    <h3 className="font-semibold mb-2">Approval Action ({currentUserRole})</h3>
                                    <div className="space-y-3">
                                        <Label htmlFor="remarks">Remarks (Optional)</Label>
                                        <Textarea id="remarks" placeholder="Add remarks for rejection or approval..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                                        <div className="flex justify-end gap-3">
                                            <Button variant="destructive" onClick={() => handleProcessRequest('rejected')} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="animate-spin" /> : 'Reject'}
                                            </Button>
                                            <Button onClick={() => handleProcessRequest('approved')} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                                {isSaving ? <Loader2 className="animate-spin" /> : 'Approve'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SubjectChangeDetailsModal;