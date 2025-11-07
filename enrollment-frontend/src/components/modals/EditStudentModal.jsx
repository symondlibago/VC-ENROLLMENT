import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { enrollmentAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// ✅ --- ADDED SELECT COMPONENT ---
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuccessAlert from './SuccessAlert';
import ValidationErrorModal from './ValidationErrorModal';
import CustomCalendar from '../layout/CustomCalendar';
import LoadingSpinner from '../layout/LoadingSpinner';

const EditStudentModal = ({ studentId, isOpen, onClose, onUpdateSuccess }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // State for your custom alert and modal
    const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });
    const [validationError, setValidationError] = useState({ isOpen: false, message: '' });

    const fetchStudentDetails = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const response = await enrollmentAPI.getStudentDetails(studentId);
            if (response.success) {
                const studentData = response.data.student;
                // Initialize form data with ALL editable fields
                setFormData({
                    student_id_number: studentData.student_id_number || '',
                    
                    // ✅ --- ADDED academic_status ---
                    academic_status: studentData.academic_status || 'Regular',

                    // Basic Info
                    last_name: studentData.last_name || '',
                    first_name: studentData.first_name || '',
                    middle_name: studentData.middle_name || '',
                    gender: studentData.gender || '',
                    birth_date: studentData.birth_date || '',
                    birth_place: studentData.birth_place || '',
                    nationality: studentData.nationality || '',
                    civil_status: studentData.civil_status || '',
                    religion: studentData.religion || '',
                    address: studentData.address || '',
                    contact_number: studentData.contact_number || '',
                    email_address: studentData.email_address || '',
                    // Parent Info
                    father_name: studentData.father_name || '',
                    father_occupation: studentData.father_occupation || '',
                    father_contact_number: studentData.father_contact_number || '',
                    mother_name: studentData.mother_name || '',
                    mother_occupation: studentData.mother_occupation || '',
                    mother_contact_number: studentData.mother_contact_number || '',
                    parents_address: studentData.parents_address || '',
                    // Emergency Contact
                    emergency_contact_name: studentData.emergency_contact_name || '',
                    emergency_contact_number: studentData.emergency_contact_number || '',
                    emergency_contact_address: studentData.emergency_contact_address || '',
                    // Education
                    elementary: studentData.elementary || '',
                    elementary_date_completed: studentData.elementary_date_completed || '',
                    junior_high_school: studentData.junior_high_school || '',
                    junior_high_date_completed: studentData.junior_high_date_completed || '',
                    senior_high_school: studentData.senior_high_school || '',
                    senior_high_date_completed: studentData.senior_high_date_completed || '',
                    high_school_non_k12: studentData.high_school_non_k12 || '',
                    high_school_non_k12_date_completed: studentData.high_school_non_k12_date_completed || '',
                    college: studentData.college || '',
                    college_date_completed: studentData.college_date_completed || '',
                });
            } else {
                setAlert({ isVisible: true, message: 'Failed to load student details.', type: 'error' });
                onClose();
            }
        } catch (error) {
            setAlert({ isVisible: true, message: 'An error occurred while fetching details.', type: 'error' });
            onClose();
        } finally {
            setLoading(false);
        }
    }, [studentId, onClose]);

    useEffect(() => {
        if (isOpen) {
            fetchStudentDetails();
        }
    }, [isOpen, fetchStudentDetails]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    // ✅ --- ADDED Handler for Select component ---
    const handleSelectChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (field, dateString) => {
        setFormData(prev => ({ ...prev, [field]: dateString }));
    };

    const handleSaveChanges = async () => {
        // ✅ UPDATED basic frontend check
        if (!formData.student_id_number || !formData.first_name || !formData.last_name || !formData.email_address) {
            setValidationError({ isOpen: true, message: 'Student ID, First Name, Last Name, and Email are required fields.' });
            return;
        }

        setSaving(true);
        try {
            await enrollmentAPI.updateStudentDetails(studentId, formData);
            setAlert({ isVisible: true, message: 'Student details updated successfully!', type: 'success' });
            
            // Wait for the alert to be visible before closing
            setTimeout(() => {
                onUpdateSuccess();
                onClose();
            }, 1500);

        } catch (error) {
            if (error.errors) {
                // ✅ Handle new validation error for student_id_number
                let errorMsg = '';
                if (error.errors.student_id_number) {
                    errorMsg = error.errors.student_id_number[0];
                } else if (error.errors.academic_status) { // ✅ Handle new error
                    errorMsg = error.errors.academic_status[0];
                } else {
                    errorMsg = Object.values(error.errors)[0][0];
                }
                setValidationError({ isOpen: true, message: errorMsg });
            } else {
                setAlert({ isVisible: true, message: error.message || "Failed to update details.", type: 'error' });
            }
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    // Helper for rendering standard bordered inputs
    const renderInput = (id, label, props) => (
        <div className="space-y-1">
            <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
            <Input id={id} value={formData[id] || ''} onChange={handleInputChange} disabled={saving} className="border-gray-300 focus:ring-gray-500" {...props} />
        </div>
    );
    
    // ✅ --- ADDED Helper for Select component ---
    const renderSelect = (id, label, placeholder, options) => (
        <div className="space-y-1">
            <Label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</Label>
            <Select 
                id={id} 
                value={formData[id] || ''} 
                onValueChange={(value) => handleSelectChange(id, value)} 
                disabled={saving}
            >
                <SelectTrigger className="w-full border-gray-300 focus:ring-gray-500">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <>
            <SuccessAlert 
                isVisible={alert.isVisible} 
                message={alert.message} 
                type={alert.type} 
                onClose={() => setAlert({ ...alert, isVisible: false })} 
            />
            <ValidationErrorModal 
                isOpen={validationError.isOpen} 
                message={validationError.message} 
                onClose={() => setValidationError({ ...validationError, isOpen: false })}
            />
            <AnimatePresence>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b bg-red-800 rounded-t-lg">
                            <h2 className="text-lg font-semibold text-white">Edit Student Details</h2>
                            <Button className="w-7 h-7 cursor-pointer text-white hover:bg-white hover:text-red-800" variant="ghost" size="sm" onClick={onClose} disabled={saving}><X className="w-5 h-5" /></Button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            {loading ? (
                                <div className="flex justify-center items-center h-96">
                                    <LoadingSpinner size="lg" color="red" />
                                </div>
                            ) : (
                                <>
                                    {/* --- Basic Information --- */}
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>
                                        
                                        {/* ✅ UPDATED Student ID and Academic Status Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {renderInput("student_id_number", "Student ID Number", { placeholder: "2025-0001" })}
                                            <div className="md:col-span-1">
                                                {renderSelect("academic_status", "Academic Status", "Select Status", [
                                                    { value: "Regular", label: "Regular" },
                                                    { value: "Irregular", label: "Irregular" },
                                                    { value: "Withdraw", label: "Withdraw" },
                                                ])}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {renderInput("first_name", "First Name", { placeholder: "Juan" })}
                                            {renderInput("middle_name", "Middle Name", { placeholder: "Reyes" })}
                                            {renderInput("last_name", "Last Name", { placeholder: "Dela Cruz" })}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {renderInput("email_address", "Email Address", { type: "email", placeholder: "juan.delacruz@example.com" })}
                                            {renderInput("contact_number", "Contact Number", { placeholder: "0917..." })}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">Birth Date</Label>
                                                <CustomCalendar value={formData.birth_date} onChange={(date) => handleDateChange('birth_date', date)} />
                                            </div>
                                            {renderInput("birth_place", "Birth Place", { placeholder: "Manila" })}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {renderInput("gender", "Gender", { placeholder: "Male" })}
                                            {renderInput("civil_status", "Civil Status", { placeholder: "Single" })}
                                            {renderInput("nationality", "Nationality", { placeholder: "Filipino" })}
                                        </div>
                                        {renderInput("address", "Address", { placeholder: "123 Main St, Brgy, City" })}
                                    </div>

                                    {/* --- Parent/Guardian Information --- */}
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Parent/Guardian Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {renderInput("father_name", "Father's Name")}
                                            {renderInput("father_occupation", "Occupation")}
                                            {renderInput("father_contact_number", "Contact Number")}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {renderInput("mother_name", "Mother's Name")}
                                            {renderInput("mother_occupation", "Occupation")}
                                            {renderInput("mother_contact_number", "Contact Number")}
                                        </div>
                                        {renderInput("parents_address", "Parents' Address")}
                                    </div>

                                    {/* --- Emergency Contact Information --- */}
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Emergency Contact Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {renderInput("emergency_contact_name", "Contact Name")}
                                            {renderInput("emergency_contact_number", "Contact Number")}
                                        </div>
                                        {renderInput("emergency_contact_address", "Contact Address")}
                                    </div>

                                    {/* --- Educational Background --- */}
                                    <div className="p-4 border rounded-lg space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Educational Background</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                            {renderInput("elementary", "Elementary School")}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">Date Completed</Label>
                                                <CustomCalendar value={formData.elementary_date_completed} onChange={(date) => handleDateChange('elementary_date_completed', date)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                            {renderInput("junior_high_school", "Junior High School")}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">Date Completed</Label>
                                                <CustomCalendar value={formData.junior_high_date_completed} onChange={(date) => handleDateChange('junior_high_date_completed', date)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                            {renderInput("senior_high_school", "Senior High School")}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">Date Completed</Label>
                                                <CustomCalendar value={formData.senior_high_date_completed} onChange={(date) => handleDateChange('senior_high_date_completed', date)} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                            {renderInput("college", "College (if transferee)")}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-gray-700">Date Completed</Label>
                                                <CustomCalendar value={formData.college_date_completed} onChange={(date) => handleDateChange('college_date_completed', date)} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-end p-4 border-t bg-gray-50 rounded-b-lg">
                            <Button variant="outline" onClick={onClose} disabled={saving} className="mr-2">Cancel</Button>
                            <Button onClick={handleSaveChanges} disabled={loading || saving} className="bg-red-700 hover:bg-red-800 text-white min-w-[120px]">
                                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>) : (<><Save className="w-4 h-4 mr-2" /> Save Changes</>)}
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </>
    );
};

export default EditStudentModal;