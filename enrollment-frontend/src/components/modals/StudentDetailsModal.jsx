import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { enrollmentAPI, paymentAPI } from '../../services/api'; 
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem 
} from "@/components/ui/select";

// Import the new components
import SuccessAlert from './SuccessAlert'; 
import ValidationErrorModal from './ValidationErrorModal';
import CustomCalendar from '../layout/CustomCalendar';
import DownloadCOR from '../layout/DownloadCOR';

const StudentDetailsModal = ({ isOpen, onClose, studentId, currentUserRole }) => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [subjectsWithSchedules, setSubjectsWithSchedules] = useState([]);
  const [error, setError] = useState(null);
  
  // Payment form state
  const [paymentData, setPaymentData] = useState({
    previous_account: '',
    registration_fee: '',
    tuition_fee: 0,
    laboratory_fee: 0,
    miscellaneous_fee: '',
    other_fees: '',
    bundled_program_fee: 0,
    total_amount: 0,
    payment_amount: '',
    discount: '',
    discount_deduction: 0,
    remaining_amount: 0,
    term_payment: 0,
    payment_date: new Date().toISOString().split('T')[0]
  });
  
  const [paymentSaving, setPaymentSaving] = useState(false);
  
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });
  const [validationModal, setValidationModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentDetails();
    }
  }, [isOpen, studentId]);

  useEffect(() => {
    if (!student || !subjectsWithSchedules) return;

    const totalLecHrs = subjectsWithSchedules.reduce((sum, subject) => sum + (parseFloat(subject.lec_hrs) || 0), 0);
    const newTuitionFee = totalLecHrs * 528;

    const totalLabHrs = subjectsWithSchedules.reduce((sum, subject) => sum + (parseFloat(subject.lab_hrs) || 0), 0);
    const newLaboratoryFee = totalLabHrs * 350; 

    let newBundledProgramFee = 0;
    const programCode = student.course?.program?.program_code;
    if (programCode === 'SHS' || programCode === 'Diploma') {
        newBundledProgramFee = 17750;
    } else if (programCode === 'Bachelor') {
        newBundledProgramFee = 0;
    }

    const prevAccount = parseFloat(paymentData.previous_account) || 0;
    const regFee = parseFloat(paymentData.registration_fee) || 0;
    const miscFee = parseFloat(paymentData.miscellaneous_fee) || 0;
    const otherFee = parseFloat(paymentData.other_fees) || 0;
    const paymentAmount = parseFloat(paymentData.payment_amount) || 0;
    const discountPercent = parseFloat(paymentData.discount) || 0;

    const newTotalAmount = prevAccount + newTuitionFee + newLaboratoryFee + miscFee + otherFee + newBundledProgramFee - regFee;
    const newDiscountDeduction = newTotalAmount * (discountPercent / 100);
    const newRemainingAmount = newTotalAmount - newDiscountDeduction - paymentAmount;
    const newTermPayment = newRemainingAmount > 0 ? newRemainingAmount / 4 : 0;

    setPaymentData(prev => ({
        ...prev,
        tuition_fee: newTuitionFee.toFixed(2),
        laboratory_fee: newLaboratoryFee.toFixed(2),
        bundled_program_fee: newBundledProgramFee.toFixed(2),
        total_amount: newTotalAmount.toFixed(2),
        discount_deduction: newDiscountDeduction.toFixed(2),
        remaining_amount: newRemainingAmount.toFixed(2),
        term_payment: newTermPayment.toFixed(2),
    }));

  }, [
    student, 
    subjectsWithSchedules, 
    paymentData.previous_account, 
    paymentData.registration_fee, 
    paymentData.miscellaneous_fee, 
    paymentData.other_fees, 
    paymentData.payment_amount, 
    paymentData.discount
  ]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enrollmentAPI.getStudentDetails(studentId);
      
      if (response.success) {
        const studentData = response.data.student;
        const subjectsData = response.data.subjects || [];

        setStudent(studentData);
        setSubjectsWithSchedules(subjectsData);

      } else {
        setError('Failed to load student details');
      }
    } catch (error) {
      setError(error.message || 'An error occurred while fetching student details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (field, value, label) => {
    const newStatus = value === '1';
    const originalStudent = { ...student };

    try {
      setStudent(prev => ({ ...prev, [`${field}_approved`]: newStatus }));
      await enrollmentAPI.updateApprovalStatus(studentId, field, newStatus);
      
      setAlert({
        isVisible: true,
        message: `${label} status updated to ${newStatus ? 'Approved' : 'Pending'}.`,
        type: 'success',
      });

    } catch (err) {
      console.error("Failed to update status:", err);
      setStudent(originalStudent); 
      setAlert({
        isVisible: true,
        message: err.response?.data?.message || 'Update failed. Please try again.',
        type: 'error',
      });
    }
  };

  const handlePaymentInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };
  
  const handlePaymentDateChange = (dateString) => {
    if (!dateString) {
      setPaymentData(prev => ({ ...prev, payment_date: '' }));
      return;
    }
    const formattedDate = new Date(dateString).toISOString().split('T')[0];
    setPaymentData(prev => ({ ...prev, payment_date: formattedDate }));
  };

  const handleSavePayment = async () => {
    if (!paymentData.registration_fee || parseFloat(paymentData.registration_fee) <= 0) {
      setValidationModal({ isOpen: true, message: 'Registration Fee is required and must be greater than zero.' });
      return;
    }
    if (!paymentData.payment_amount || parseFloat(paymentData.payment_amount) <= 0) {
      setValidationModal({ isOpen: true, message: 'Payment Amount is required and must be greater than zero.' });
      return;
    }
    if (!paymentData.total_amount || parseFloat(paymentData.total_amount) <= 0) {
      setValidationModal({ isOpen: true, message: 'Total Amount must be greater than zero.' });
      return;
    }
    if (!paymentData.payment_date) {
      setValidationModal({ isOpen: true, message: 'Payment Date is required.' });
      return;
    }

    try {
      setPaymentSaving(true);
      const paymentPayload = {
        ...paymentData,
        pre_enrolled_student_id: student.id,
        enrollment_code_id: student.enrollment_code?.id || student.enrollment_code_id
      };
      const response = await paymentAPI.create(paymentPayload);
      if (response.success) {
        setAlert({ isVisible: true, message: 'Payment information saved successfully!', type: 'success' });
      } else {
        setAlert({ isVisible: true, message: response.message || 'Failed to save payment information.', type: 'error' });
      }
    } catch (error) {
      setAlert({ isVisible: true, message: error.message || 'An error occurred while saving payment.', type: 'error' });
      console.error('Payment save error:', error);
    } finally {
      setPaymentSaving(false);
    }
  };
  
  const ApprovalDropdown = ({ label, field, value, disabled = false }) => {
    const canEdit = currentUserRole === 'Admin' ||
      (currentUserRole === 'Program Head' && field === 'program_head') ||
      (currentUserRole === 'Registrar' && field === 'registrar') ||
      (currentUserRole === 'Cashier' && field === 'cashier');
    return (
      <div className="space-y-2">
        <Label htmlFor={`${field}-approval`}>{label}</Label>
        <Select
          id={`${field}-approval`}
          disabled={!canEdit || disabled}
          value={value ? '1' : '0'}
          onValueChange={(newValue) => handleStatusUpdate(field, newValue, label)}
        >
          <SelectTrigger className={value ? 'border-green-500' : 'border-yellow-500'}>
            <SelectValue placeholder="Set status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Approved</SelectItem>
            <SelectItem value="0">Pending / Reject</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <SuccessAlert isVisible={alert.isVisible} message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, isVisible: false })} />
      <ValidationErrorModal isOpen={validationModal.isOpen} message={validationModal.message} onClose={() => setValidationModal({ isOpen: false, message: '' })} />
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-800 text-white z-10 flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Student Details</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:text-red-800 hover:bg-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : student ? (
            <div className="space-y-6">
              
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-xl font-medium mb-3 text-black">BASIC INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Student ID No.</p><p className="font-medium">{student.student_id_number}</p></div>
                  <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{student.last_name}, {student.first_name} {student.middle_name || ''}</p></div>
                  <div><p className="text-sm text-gray-500">Email Address</p><p className="font-medium">{student.email_address}</p></div>
                  <div><p className="text-sm text-gray-500">Contact Number</p><p className="font-medium">{student.contact_number}</p></div>
                  <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium">{student.gender}</p></div>
                  <div><p className="text-sm text-gray-500">Birth Date</p><p className="font-medium">{new Date(student.birth_date).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-gray-500">Birth Place</p><p className="font-medium">{student.birth_place}</p></div>
                  <div><p className="text-sm text-gray-500">Nationality</p><p className="font-medium">{student.nationality}</p></div>
                  <div><p className="text-sm text-gray-500">Civil Status</p><p className="font-medium">{student.civil_status}</p></div>
                  <div><p className="text-sm text-gray-500">Religion</p><p className="font-medium">{student.religion || 'Not specified'}</p></div>
                  <div><p className="text-sm text-gray-500">Address</p><p className="font-medium">{student.address}</p></div>
                </div>
              </div>

              {/* Enrollment Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-black">ENROLLMENT INFORMATION</h3>
                  {student.cashier_approved && (
                    <DownloadCOR 
                      student={student} 
                      subjectsWithSchedules={subjectsWithSchedules} 
                      paymentData={paymentData} // <-- FIX: Pass paymentData as a prop
                    />
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Course</p><p className="font-medium">[{student.course ? student.course.course_code : 'N/A'}] {student.course ? student.course.course_name : 'N/A'}</p></div>
                  <div><p className="text-sm text-gray-500">Year Level</p><p className="font-medium">{student.year}</p></div>
                  <div><p className="text-sm text-gray-500">Enrollment Type</p><p className="font-medium">{student.enrollment_type}</p></div>
                  <div><p className="text-sm text-gray-500">Semester</p><p className="font-medium">{student.semester}</p></div>
                  <div><p className="text-sm text-gray-500">School Year</p><p className="font-medium">{student.school_year}</p></div>
                  <div><p className="text-sm text-gray-500">Enrollment Date</p><p className="font-medium">{new Date(student.created_at).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-gray-500">Enrollment Code</p><p className="font-medium">{student.enrollment_code?.code || 'N/A'}</p></div>
                  <div><p className="text-sm text-gray-500">Program</p><p className="font-medium">{student.course?.program?.program_code || 'N/A'} Program</p></div>
                </div>
              </div>

              {/* Approval Actions Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">APPROVAL ACTIONS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ApprovalDropdown label="Program Head" field="program_head" value={student.program_head_approved} />
                  <ApprovalDropdown label="Registrar" field="registrar" value={student.registrar_approved} disabled={!student.program_head_approved && currentUserRole !== 'Admin'} />
                  <ApprovalDropdown label="Cashier" field="cashier" value={student.cashier_approved} disabled={(!student.program_head_approved || !student.registrar_approved) && currentUserRole !== 'Admin'} />
                </div>
                {(!student.program_head_approved && currentUserRole === 'Registrar') && <p className="text-xs text-yellow-600 mt-2">Waiting for Program Head approval.</p>}
                {((!student.program_head_approved || !student.registrar_approved) && currentUserRole === 'Cashier') && <p className="text-xs text-yellow-600 mt-2">Waiting for Program Head & Registrar approval.</p>}
              </div>

              {/* Selected Subjects */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">SELECTED SUBJECTS & SCHEDULE</h3>
                {subjectsWithSchedules.length > 0 ? (
                  <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descriptive Title</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule (Day / Time / Room)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subjectsWithSchedules.map((subject) => (
                          <tr key={subject.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.subject_code}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.descriptive_title}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.total_units}</td>
                            <td className="px-4 py-2 whitespace-pre-wrap text-xs">
                                {subject.schedules && subject.schedules.length > 0
                                    ? subject.schedules.map(s => `${s.day || 'TBA'} / ${s.time || 'TBA'} / ${s.room_no || 'TBA'}`).join('\n')
                                    : 'TBA'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table></div>
                ) : <p className="text-gray-500">No subjects selected</p>}
              </div>

              {/* Payment Information Section */}
              {currentUserRole === 'Cashier' && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-red-200">
                  <h3 className="text-lg font-medium mb-4 text-black flex items-center">PAYMENT INFORMATION</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium mb-3 text-gray-700">Fee Structure</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Previous Account</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.previous_account} onChange={(e) => handlePaymentInputChange('previous_account', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.registration_fee} onChange={(e) => handlePaymentInputChange('registration_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tuition Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" readOnly value={paymentData.tuition_fee} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" readOnly value={paymentData.laboratory_fee} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.miscellaneous_fee} onChange={(e) => handlePaymentInputChange('miscellaneous_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Other Fees</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.other_fees} onChange={(e) => handlePaymentInputChange('other_fees', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Bundled Program Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" readOnly value={paymentData.bundled_program_fee} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" /></div></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium mb-3 text-gray-700">Payment Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" readOnly value={paymentData.total_amount} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.payment_amount} onChange={(e) => handlePaymentInputChange("payment_amount", e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label><div className="relative"><input type="number" value={paymentData.discount} onChange={(e) => handlePaymentInputChange("discount", e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0" min="0" max="100" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount Deduction</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" readOnly value={paymentData.discount_deduction} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" readOnly value={paymentData.remaining_amount} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Term Payment</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" readOnly value={paymentData.term_payment} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label><CustomCalendar value={paymentData.payment_date} onChange={handlePaymentDateChange} placeholder="Select Payment Date" /></div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleSavePayment}
                        disabled={paymentSaving}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 flex items-center space-x-2"
                      >
                        {paymentSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Payment</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Parent/Guardian Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">PARENT/GUARDIAN INFORMATION</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Father's Name</p>
                    <p className="font-medium">{student.father_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Father's Occupation</p>
                    <p className="font-medium">{student.father_occupation || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Father's Contact</p>
                    <p className="font-medium">{student.father_contact_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother's Name</p>
                    <p className="font-medium">{student.mother_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother's Occupation</p>
                    <p className="font-medium">{student.mother_occupation || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mother's Contact</p>
                    <p className="font-medium">{student.mother_contact_number || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Parents' Address</p>
                    <p className="font-medium">{student.parents_address || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">EMERGENCY CONTACT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{student.emergency_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-medium">{student.emergency_contact_number}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{student.emergency_contact_address}</p>
                  </div>
                </div>
              </div>

              {/* Educational Background with Images */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Side: Educational Background Header + Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-black border-b pb-1">
                      EDUCATIONAL BACKGROUND
                    </h3>
                    <div className="space-y-4">
                      {student.elementary && (
                        <div>
                          <p className="text-sm font-medium">Elementary</p>
                          <p className="text-sm">{student.elementary}</p>
                          <p className="text-xs text-gray-500">Completed: {student.elementary_date_completed || 'Not specified'}</p>
                        </div>
                      )}
                      {student.junior_high_school && (
                        <div>
                          <p className="text-sm font-medium">Junior High School</p>
                          <p className="text-sm">{student.junior_high_school}</p>
                          <p className="text-xs text-gray-500">Completed: {student.junior_high_date_completed || 'Not specified'}</p>
                        </div>
                      )}
                      {student.senior_high_school && (
                        <div>
                          <p className="text-sm font-medium">Senior High School</p>
                          <p className="text-sm">{student.senior_high_school}</p>
                          <p className="text-xs text-gray-500">Completed: {student.senior_high_date_completed || 'Not specified'}</p>
                        </div>
                      )}
                      {student.high_school_non_k12 && (
                        <div>
                          <p className="text-sm font-medium">High School (Non-K12)</p>
                          <p className="text-sm">{student.high_school_non_k12}</p>
                          <p className="text-xs text-gray-500">Completed: {student.high_school_non_k12_date_completed || 'Not specified'}</p>
                        </div>
                      )}
                      {student.college && (
                        <div>
                          <p className="text-sm font-medium">College</p>
                          <p className="text-sm">{student.college}</p>
                          <p className="text-xs text-gray-500">Completed: {student.college_date_completed || 'Not specified'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Header + ID Photo & Signature Side by Side */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-black border-b pb-1 text-right">
                      IDENTIFICATION & SIGNATURE
                    </h3>
                    <div className="flex justify-end gap-4">
                      {student.id_photo_url && (
                        <div className="w-40 h-40 border rounded-lg overflow-hidden shadow-md">
                          <img src={student.id_photo_url} alt="ID Photo" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {student.signature_url && (
                        <div className="w-40 h-40 border rounded-lg overflow-hidden shadow-md">
                          <img src={student.signature_url} alt="Signature" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">No student data found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsModal;