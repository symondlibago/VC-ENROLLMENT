import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Loader2, Clock, Check } from 'lucide-react';
import { enrollmentAPI, paymentAPI } from '../../services/api'; 
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; 
import { Badge } from "@/components/ui/badge";
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

// ... ApprovalAction Component (No changes) ...
const ApprovalAction = ({
  roleLabel,
  roleName,
  studentId,
  studentApprovals,
  currentUserRole,
  disabled = false,
  onApprovalSaved,
}) => {
  const currentApproval = studentApprovals.find(a => a.role === roleName);
  
  const [status, setStatus] = useState(currentApproval?.status || 'pending');
  const [remarks, setRemarks] = useState(currentApproval?.remarks || '');
  const [isSaving, setIsSaving] =useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const updatedApproval = studentApprovals.find(a => a.role === roleName);
    setStatus(updatedApproval?.status || 'pending');
    setRemarks(updatedApproval?.remarks || '');
  }, [studentApprovals, roleName]);
  
  const canEdit = currentUserRole === 'Admin' || currentUserRole === roleName;
  const isModified = status !== (currentApproval?.status || 'pending') || remarks !== (currentApproval?.remarks || '');

  const handleSave = async () => {
    if (!status || status === 'pending') {
      setError('Please select a status (Approved or Rejected).');
      return;
    }
    setError('');
    setIsSaving(true);
    try {
      await enrollmentAPI.submitApproval(studentId, { status, remarks, roleName });
      onApprovalSaved();
    } catch (err)
 {
      setError(err.message || 'Failed to save approval.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColorClass = (currentStatus) => {
    if (currentStatus === 'approved') return 'border-green-500';
    if (currentStatus === 'rejected') return 'border-red-500';
    return 'border-yellow-500';
  };

  const approvalDate = currentApproval?.updated_at;
  let formattedDate = '';
  if (approvalDate) {
    formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(approvalDate));
  }

  return (
    <div className="bg-white p-4 rounded-md border space-y-3">
      <Label htmlFor={`${roleName}-approval`} className="font-semibold text-gray-800">{roleLabel}</Label>
      <Select
        id={`${roleName}-approval`}
        disabled={!canEdit || disabled}
        value={status}
        onValueChange={setStatus}
      >
        <SelectTrigger className={getStatusColorClass(currentApproval?.status)}>
          <SelectValue placeholder="Set status..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>
      <div className="space-y-1">
        <Label htmlFor={`${roleName}-remarks`} className="text-sm text-gray-600">Remarks</Label>
        <Textarea
          id={`${roleName}-remarks`}
          placeholder="Add remarks..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          disabled={!canEdit || disabled}
          className="min-h-20"
        />
      </div>
      <div className="flex items-center justify-between pt-1 min-h-9">
        <div className="text-xs text-gray-500 flex items-center">
          {formattedDate && (
            <>
              <Clock size={12} className="mr-1.5" />
              <span>{formattedDate}</span>
            </>
          )}
        </div>
        {canEdit && !disabled && (
          <Button
            onClick={handleSave}
            disabled={isSaving || !isModified}
            className="bg-red-700 hover:bg-red-800 text-white"
            size="sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-2">Save</span>
          </Button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};


const defaultPaymentState = {
  previous_account: '',
  registration_fee: '',
  tuition_fee: 0,
  laboratory_fee: 0,
  miscellaneous_fee: '',
  other_fees: '',
  bundled_program_fee: 0,
  total_amount: 0,
  payment_amount: '',
  discount: 0,
  discount_deduction: 0,
  remaining_amount: 0,
  term_payment: 0,
  payment_date: new Date().toISOString().split('T')[0],
  advance_payment: 0, 
};

const defaultManualEdit = {
  previous_account: false,
  registration_fee: false,
  tuition_fee: false,
  laboratory_fee: false,
  miscellaneous_fee: false,
  other_fees: false,
  bundled_program_fee: false,
  total_amount: false,
  discount: false,
  discount_deduction: false,
  remaining_amount: false, // Always false
  advance_payment: false, // ✅ Will be used to lock the field
  payment_amount: false,
  term_payment: false,
};


const StudentDetailsModal = ({ isOpen, onClose, studentId, currentUserRole }) => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [subjectsWithSchedules, setSubjectsWithSchedules] = useState([]);
  const [error, setError] = useState(null);
  
  const [creditingSubjectId, setCreditingSubjectId] = useState(null);

  // Payment form state
  const [paymentData, setPaymentData] = useState(defaultPaymentState);
  const [manualEdit, setManualEdit] = useState(defaultManualEdit);

  const [paymentSaving, setPaymentSaving] = useState(false);
  
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });
  const [validationModal, setValidationModal] = useState({ isOpen: false, message: '' });

  // ... fetchStudentDetails (No changes) ...
  const fetchStudentDetails = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      
      setPaymentData(defaultPaymentState);
      setManualEdit(defaultManualEdit); // Reset to all false
      setStudent(null);
      setSubjectsWithSchedules([]);

      const studentRes = await enrollmentAPI.getStudentDetails(studentId);
      if (!studentRes.success) {
        throw new Error('Failed to load student details');
      }
      const studentData = studentRes.data.student;
      const studentSubjects = studentRes.data.subjects || [];
      
      setStudent(studentData); 
      setSubjectsWithSchedules(studentSubjects); 

      let paymentRes = null;
      try {
        paymentRes = await paymentAPI.getByStudentId(studentId);
      } catch (err) {
        if (err.message && (err.message.includes('No payment record found') || err.message.includes('404'))) {
          // This is fine, it's a new term
        } else {
          throw new Error('Failed to load payment data'); // A real error
        }
      }

      // 3. Compare timestamps and set payment data
      if (paymentRes && paymentRes.success) {
        const payment = paymentRes.data;
        const studentLastUpdated = new Date(studentData.updated_at);
        const paymentLastUpdated = new Date(payment.updated_at);

        if (studentLastUpdated > paymentLastUpdated) {
          // CASE B: STALE payment. This is a new term.
          console.log("Stale payment record detected. Carrying over balance.");
          
          let previousDebt = 0;
          let previousCredit = 0;

          if (payment.remaining_amount && parseFloat(payment.remaining_amount) > 0) {
            previousDebt = parseFloat(payment.remaining_amount);
          }
          if (payment.advance_payment && parseFloat(payment.advance_payment) > 0) {
            previousCredit = parseFloat(payment.advance_payment);
          }
          
          // Set state based on previous term's balance
          setPaymentData(prev => ({
            ...prev,
            previous_account: previousDebt.toString(),
            advance_payment: previousCredit.toString(),
          }));

          // Lock the fields that were carried over
          setManualEdit(prev => ({
            ...prev,
            previous_account: true, // Lock previous account
            advance_payment: true,  // Lock advance payment
          }));

        } else {
          // CASE C: CURRENT payment. Load it and lock fields.
          setPaymentData(payment);
          setManualEdit({
            previous_account: true,
            registration_fee: true,
            tuition_fee: true,
            laboratory_fee: true,
            miscellaneous_fee: true,
            other_fees: true,
            bundled_program_fee: true,
            total_amount: true,
            discount: true,
            discount_deduction: true,
            remaining_amount: false, 
            advance_payment: true, // Also lock advance payment
            payment_amount: true,
            term_payment: true,
          });
        }
      }
      // If paymentRes is null (Case A), manualEdit remains all `false`
      // and the calculator will run.

    } catch (error) {
      setError(error.message || 'An error occurred while fetching student details');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (isOpen) {
      fetchStudentDetails();
    }
  }, [isOpen, fetchStudentDetails]);

  // CALCULATION LOGIC
  useEffect(() => {
    if (loading || !student || !subjectsWithSchedules) return;

    // --- 1. Calculate base auto-fees (unchanged) ---
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
    
    // --- 2. Get all values, respecting manualEdit flags (unchanged) ---
    const tuition = manualEdit.tuition_fee ? (parseFloat(paymentData.tuition_fee) || 0) : newTuitionFee;
    const lab = manualEdit.laboratory_fee ? (parseFloat(paymentData.laboratory_fee) || 0) : newLaboratoryFee;
    const bundled = manualEdit.bundled_program_fee ? (parseFloat(paymentData.bundled_program_fee) || 0) : newBundledProgramFee;
    const prevAccountDebt = parseFloat(paymentData.previous_account) || 0;
    const prevCredit = parseFloat(paymentData.advance_payment) || 0; // This will be 3000
    const regFee = parseFloat(paymentData.registration_fee) || 0;
    const miscFee = parseFloat(paymentData.miscellaneous_fee) || 0;
    const otherFee = parseFloat(paymentData.other_fees) || 0;
    const paymentAmount = parseFloat(paymentData.payment_amount) || 0;
    const discountPercent = parseFloat(paymentData.discount) || 0;

    // --- 3. Calculate Total and Discount (unchanged) ---
    const total = (prevAccountDebt + regFee + miscFee + otherFee + tuition + lab + bundled) - prevCredit;
    const newTotalAmount = manualEdit.total_amount ? (parseFloat(paymentData.total_amount) || 0) : total;
    const newDiscountDeduction = manualEdit.discount_deduction
        ? (parseFloat(paymentData.discount_deduction) || 0)
        : newTotalAmount * (discountPercent / 100);

    // --- 4. Calculate Final Remaining Amount & Term Payment (unchanged) ---
    const balanceAfterDownPayment = newTotalAmount - newDiscountDeduction - paymentAmount; 
    let newRemainingAmount = balanceAfterDownPayment;
    let newAdvancePayment = 0;
    if (newRemainingAmount < 0) {
        newAdvancePayment = Math.abs(newRemainingAmount); // Store the overpayment
        newRemainingAmount = 0; // Cap remaining at 0
    }
    const newTermPayment = manualEdit.term_payment
      ? (parseFloat(paymentData.term_payment) || 0)
      : (newRemainingAmount > 0 ? newRemainingAmount / 4 : 0); 

    // --- 5. Set State (MODIFIED) ---
    setPaymentData(prev => ({
        ...prev,
        // Update auto-fields if NOT manually edited
        tuition_fee: manualEdit.tuition_fee ? prev.tuition_fee : newTuitionFee.toFixed(2),
        laboratory_fee: manualEdit.laboratory_fee ? prev.laboratory_fee : newLaboratoryFee.toFixed(2),
        bundled_program_fee: manualEdit.bundled_program_fee ? prev.bundled_program_fee : newBundledProgramFee.toFixed(2),
        total_amount: manualEdit.total_amount ? prev.total_amount : newTotalAmount.toFixed(2),
        discount_deduction: manualEdit.discount_deduction ? prev.discount_deduction : newDiscountDeduction.toFixed(2),
        
        // Always calculated
        remaining_amount: newRemainingAmount.toFixed(2), 
        advance_payment:
        manualEdit.advance_payment
        ? prev.advance_payment
        : (
            newAdvancePayment > 0
                ? newAdvancePayment.toFixed(2)
                : prev.advance_payment
        ),
        
        term_payment: manualEdit.term_payment ? prev.term_payment : newTermPayment.toFixed(2),
    }));

  }, [
    // ... Dependencies (unchanged) ...
    loading, student, subjectsWithSchedules, 
    paymentData.previous_account, 
    paymentData.registration_fee, 
    paymentData.miscellaneous_fee, 
    paymentData.other_fees, 
    paymentData.payment_amount, 
    paymentData.discount,
    paymentData.tuition_fee,
    paymentData.laboratory_fee,
    paymentData.bundled_program_fee,
    paymentData.total_amount,
    paymentData.discount_deduction,
    paymentData.term_payment,
    manualEdit
  ]);

  const handleApprovalUpdated = () => {
    setAlert({
        isVisible: true,
        message: 'Approval status saved successfully!',
        type: 'success',
    });
    fetchStudentDetails(); 
  };

  const handlePaymentInputChange = (field, value) => {
    if (field === 'remaining_amount') return;
    setPaymentData(prev => ({ ...prev, [field]: value }));
    const newManualEdit = { ...manualEdit, [field]: true };
    if (field === 'payment_amount') {
      newManualEdit.advance_payment = false;
    }
    
    setManualEdit(newManualEdit);
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
    const regFee = parseFloat(paymentData.registration_fee);
    const paymentAmount = parseFloat(paymentData.payment_amount);
    const totalAmount = parseFloat(paymentData.total_amount);

    if (regFee < 0 || (paymentData.registration_fee !== '' && isNaN(regFee))) {
      setValidationModal({ isOpen: true, message: 'Registration Fee must be a valid, non-negative number.' }); 
      return;
    }
    if (paymentAmount < 0 || (paymentData.payment_amount !== '' && isNaN(paymentAmount))) {
      setValidationModal({ isOpen: true, message: 'Payment Amount must be a valid, non-negative number.' }); 
      return;
    }
    if (totalAmount < 0 || (paymentData.total_amount !== '' && isNaN(totalAmount))) {
      setValidationModal({ isOpen: true, message: 'Total Amount must be a valid, non-negative number.' }); 
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
        registration_fee: isNaN(regFee) ? 0 : regFee, 
        payment_amount: isNaN(paymentAmount) ? 0 : paymentAmount,
        total_amount: isNaN(totalAmount) ? 0 : totalAmount,
        advance_payment: "0.00",
        pre_enrolled_student_id: student.id,
        enrollment_code_id: student.enrollment_code?.id || student.enrollment_code_id
      };
      
      const response = await paymentAPI.create(paymentPayload);
      if (response.success) {
        setAlert({ isVisible: true, message: 'Payment information saved successfully!', type: 'success' });
        fetchStudentDetails();
      } else {
        setAlert({ isVisible: true, message: response.message || 'Failed to save payment information.', type: 'error' });
      }
    } catch (error) {
        if (error.errors) {
            const errorMessages = Object.values(error.errors).flat().join(' ');
            setAlert({ isVisible: true, message: `Validation failed: ${errorMessages}`, type: 'error' });
        } else {
            setAlert({ isVisible: true, message: error.message || 'An error occurred while saving payment.', type: 'error' });
        }
      console.error('Payment save error:', error);
    } finally {
      setPaymentSaving(false);
    }
  };

  // ... handleCreditSubject (No changes) ...
  const handleCreditSubject = async (subjectId) => {
    setCreditingSubjectId(subjectId); 
    try {
      const response = await enrollmentAPI.creditSubject(student.id, subjectId);
      if (response.success) {
        setAlert({
          isVisible: true,
          message: 'Subject credited successfully!',
          type: 'success',
        });
        fetchStudentDetails(); 
      }
    } catch (error) {
      setAlert({
        isVisible: true,
        message: error.message || 'Failed to credit subject.',
        type: 'error',
      });
    } finally {
      setCreditingSubjectId(null); 
    }
  };

  // ... subjectTotals (No changes) ...
  const subjectTotals = useMemo(() => {
    if (!subjectsWithSchedules) {
      return { units: 0, lec: 0, lab: 0 };
    }
    return subjectsWithSchedules.reduce((acc, subject) => {
      acc.units += parseFloat(subject.total_units) || 0;
      acc.lec += parseFloat(subject.lec_hrs) || 0;
      acc.lab += parseFloat(subject.lab_hrs) || 0;
      return acc;
    }, { units: 0, lec: 0, lab: 0 });
  }, [subjectsWithSchedules]);

  // ... canCreditSubjects (No changes) ...
  const canCreditSubjects = (currentUserRole === 'Admin' || currentUserRole === 'Registrar') &&
                            student?.enrollment_type === 'Transferee';

  if (!isOpen) return null;
  
  // ... Rest of the return() (JSX) is identical ...
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <SuccessAlert isVisible={alert.isVisible} message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, isVisible: false })} />
      <ValidationErrorModal isOpen={validationModal.isOpen} message={validationModal.message} onClose={() => setValidationModal({ isOpen: false, message: '' })} />
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header (No changes) */}
        <div className="sticky top-0 bg-red-800 text-white z-10 flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Student Details</h2>
          <Button onClick={onClose} className="p-1 hover:text-red-800 hover:bg-white transition-colors bg-transparent cursor-pointer">
            <X size={20} />
          </Button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>
          ) : error ? (
            <div className="text-red-500 text-center p-4">{error}</div>
          ) : student ? (
            <div className="space-y-6">
              
              {/* Basic Information (No changes) */}
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

              {/* Enrollment Information (No changes) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-black">ENROLLMENT INFORMATION</h3>
                  {(currentUserRole === 'Cashier' || currentUserRole === 'Admin') && (
                    <DownloadCOR 
                      student={student} 
                      subjectsWithSchedules={subjectsWithSchedules} 
                      paymentData={paymentData} 
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

             {/* Selected Subjects Table (No changes) */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3 text-black">SELECTED SUBJECTS & SCHEDULE</h3>
              {subjectsWithSchedules.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="w-2/5 px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descriptive Title</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Units</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lec Hrs</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Hrs</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule (Day / Time / Room)</th>
                        {canCreditSubjects && (
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subjectsWithSchedules.map((subject) => {
                        
                        const grade = student.grades?.find(g => g.subject_id === subject.id);
                        const isCredited = grade && grade.status === 'Credited';

                        return (
                          <tr key={subject.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.subject_code}</td>
                            <td className="px-4 py-2 whitespace-normal wrap-break-word text-sm">{subject.descriptive_title}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.total_units}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.lec_hrs || 0}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">{subject.lab_hrs || 0}</td>
                            <td className="px-4 py-2 whitespace-pre-wrap text-xs">
                                {subject.schedules && subject.schedules.length > 0
                                    ? subject.schedules.map(s => `${s.day || 'TBA'} / ${s.time || 'TBA'} / ${s.room_no || 'TBA'}`).join('\n')
                                    : 'TBA'}
                            </td>

                            {canCreditSubjects && (
                              <td className="px-4 py-2 text-center">
                                {isCredited ? (
                                  <Badge className="bg-blue-100 text-blue-800 cursor-default">
                                    <Check className="w-3 h-3 mr-1" />
                                    Credited
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 px-2"
                                    onClick={() => handleCreditSubject(subject.id)}
                                    disabled={creditingSubjectId === subject.id}
                                  >
                                    {creditingSubjectId === subject.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      "Credit"
                                    )}
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan="2" className="px-4 py-3 text-right text-sm font-bold text-gray-700 uppercase">
                          Totals:
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {subjectTotals.units.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          {subjectTotals.lec.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowDrap text-sm font-bold text-gray-900">
                          {subjectTotals.lab.toFixed(2)}
                        </td>
                        <td className="px-4 py-3"></td>
                        {canCreditSubjects && (
                          <td className="px-4 py-3"></td>
                        )}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : <p className="text-gray-500">No subjects selected</p>}
            </div>

              {/* Approval Actions Section (No changes) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3 text-black">APPROVAL ACTIONS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ApprovalAction
                    roleLabel="Program Head"
                    roleName="Program Head"
                    studentId={student.id}
                    studentApprovals={student.enrollment_approvals || []}
                    currentUserRole={currentUserRole}
                    onApprovalSaved={handleApprovalUpdated}
                  />
                  <ApprovalAction
                    roleLabel="Registrar"
                    roleName="Registrar"
                    studentId={student.id}
                    studentApprovals={student.enrollment_approvals || []}
                    currentUserRole={currentUserRole}
                    onApprovalSaved={handleApprovalUpdated}
                    disabled={student.enrollment_approvals?.find(a => a.role === 'Program Head')?.status !== 'approved' && currentUserRole !== 'Admin'}
                  />
                  <ApprovalAction
                    roleLabel="Cashier"
                    roleName="Cashier"
                    studentId={student.id}
                    studentApprovals={student.enrollment_approvals || []}
                    currentUserRole={currentUserRole}
                    onApprovalSaved={handleApprovalUpdated}
                    disabled={(student.enrollment_approvals?.find(a => a.role === 'Program Head')?.status !== 'approved' || student.enrollment_approvals?.find(a => a.role === 'Registrar')?.status !== 'approved') && currentUserRole !== 'Admin'}
                  />
                </div>
                {student.enrollment_approvals?.find(a => a.role === 'Program Head')?.status !== 'approved' && currentUserRole === 'Registrar' &&
                  <p className="text-xs text-yellow-600 mt-2">Waiting for Program Head approval.</p>}
                {((student.enrollment_approvals?.find(a => a.role === 'Program Head')?.status !== 'approved' || student.enrollment_approvals?.find(a => a.role === 'Registrar')?.status !== 'approved') && currentUserRole === 'Cashier') &&
                  <p className="text-xs text-yellow-600 mt-2">Waiting for Program Head & Registrar approval.</p>}
              </div>

              {/* Payment Information Section (No changes) */}
              {currentUserRole === 'Cashier' && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-red-200">
                  <h3 className="text-lg font-medium mb-4 text-black flex items-center">PAYMENT INFORMATION</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium mb-3 text-gray-700">Fee Structure</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Previous Account (Debt)</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.previous_account} onChange={(e) => handlePaymentInputChange('previous_account', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">Advance Payment (Credit)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 text-sm">₱</span>
                            <input 
                              type="number" 
                              value={paymentData.advance_payment} 
                              onChange={(e) => handlePaymentInputChange('advance_payment', e.target.value)}
                              className={`w-full pl-8 pr-3 py-2 border-2 rounded-md focus:outline-none ${parseFloat(paymentData.advance_payment) > 0 ? 'border-green-200 bg-green-50 text-green-800 font-medium' : 'border-gray-300'}`} 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>

                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.registration_fee} onChange={(e) => handlePaymentInputChange('registration_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tuition Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.tuition_fee} onChange={(e) => handlePaymentInputChange('tuition_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.laboratory_fee} onChange={(e) => handlePaymentInputChange('laboratory_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.miscellaneous_fee} onChange={(e) => handlePaymentInputChange('miscellaneous_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Other Fees</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.other_fees} onChange={(e) => handlePaymentInputChange('other_fees', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Bundled Program Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.bundled_program_fee} onChange={(e) => handlePaymentInputChange('bundled_program_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium mb-3 text-gray-700">Payment Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.total_amount} onChange={(e) => handlePaymentInputChange('total_amount', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.payment_amount} onChange={(e) => handlePaymentInputChange("payment_amount", e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label><div className="relative"><input type="number" value={paymentData.discount} onChange={(e) => handlePaymentInputChange("discount", e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0" min="0" max="100" step="0.01" /></div></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Discount Deduction</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.discount_deduction} onChange={(e) => handlePaymentInputChange('discount_deduction', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                            <input 
                              type="number" 
                              value={paymentData.remaining_amount} 
                              readOnly 
                              className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none bg-gray-100" 
                              placeholder="0.00" 
                            />
                          </div>
                        </div>
                        
                        {/* This space is empty because advance_payment was moved up */}

                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Term Payment</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.term_payment} onChange={(e) => handlePaymentInputChange('term_payment', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
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
              
            {/* Parent/Guardian Information (No changes) */}
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

              {/* Emergency Contact (No changes) */}
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

              {/* Educational Background with Images (No changes) */}
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