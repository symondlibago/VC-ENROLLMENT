import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Loader2, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
import { enrollmentAPI, paymentAPI } from '../../services/api'; 
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// ✅ 1. SuccessAlert import is GONE
import ValidationErrorModal from './ValidationErrorModal';
import CustomCalendar from '../layout/CustomCalendar';

const defaultPaymentState = {
  previous_account: '',
  registration_fee: '',
  tuition_fee: 0,
  laboratory_fee: 0,
  miscellaneous_fee: '',
  other_fees: '',
  bundled_program_fee: 0,
  total_amount: 0,
  payment_amount: '', // This is the DOWN PAYMENT
  discount: '',
  discount_deduction: 0,
  remaining_amount: 0,
  term_payment: 0,
  payment_date: new Date().toISOString().split('T')[0]
};

// ✅ 2. Accept the new props: onSaveSuccess and onSaveError
const TermPaymentModal = ({ isOpen, onClose, studentId, onSaveSuccess, onSaveError }) => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [subjectsWithSchedules, setSubjectsWithSchedules] = useState([]);
  const [error, setError] = useState(null);
  
  const [paymentData, setPaymentData] = useState(defaultPaymentState);
  
  const [termPaymentInput, setTermPaymentInput] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    or_number: '',
    amount: ''
  });

  const [historicalPayments, setHistoricalPayments] = useState([]); 
  const [currentTermPayments, setCurrentTermPayments] = useState([]); 
  
  const [manualEdit, setManualEdit] = useState({
    tuition_fee: false,
    laboratory_fee: false,
    bundled_program_fee: false,
    total_amount: false,
    discount_deduction: false,
    remaining_amount: false, 
    term_payment: false,
  });

  const [paymentSaving, setPaymentSaving] = useState(false);
  // ✅ 3. The local alert state is GONE
  const [validationModal, setValidationModal] = useState({ isOpen: false, message: '' });

  // ... (useEffect for data fetching is unchanged) ...
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      // Reset states
      setPaymentData(defaultPaymentState);
      setHistoricalPayments([]); // Reset history
      setCurrentTermPayments([]); // Reset current
      setTermPaymentInput({
        payment_date: new Date().toISOString().split('T')[0],
        or_number: '',
        amount: ''
      });
      setManualEdit({
        tuition_fee: false, laboratory_fee: false, bundled_program_fee: false,
        total_amount: false, discount_deduction: false, remaining_amount: false,
        term_payment: false,
      });

      // Fetch student details
      const studentDetailsPromise = enrollmentAPI.getStudentDetails(studentId);
      
      // Fetch payment data
      const paymentDataPromise = paymentAPI.getByStudentId(studentId)
        .catch(err => {
          if (err.message && (err.message.includes('404') || err.message.includes('No payment record found'))) {
            return null; 
          }
          throw err;
        });

      Promise.all([studentDetailsPromise, paymentDataPromise])
        .then(([studentRes, paymentRes]) => {
          
          let currentStudent;
          if (studentRes.success) {
            currentStudent = studentRes.data.student;
            setStudent(currentStudent);
            setSubjectsWithSchedules(studentRes.data.subjects || []);
          } else {
            throw new Error('Failed to load student details');
          }

          if (paymentRes && paymentRes.success) {
            const payment = paymentRes.data;
            setPaymentData(payment); 
            
            const allTermPayments = payment.term_payments || [];
            const studentCurrentYear = currentStudent.year;
            const studentCurrentSemester = currentStudent.semester;
            const studentCurrentSchoolYear = currentStudent.school_year;

            const history = allTermPayments.filter(p =>
                p.year !== studentCurrentYear ||
                p.semester !== studentCurrentSemester || 
                p.school_year !== studentCurrentSchoolYear
            );

            const current = allTermPayments.filter(p =>
                p.year === studentCurrentYear &&
                p.semester === studentCurrentSemester && 
                p.school_year === studentCurrentSchoolYear
            );

            setHistoricalPayments(history);
            setCurrentTermPayments(current);
            
          }
          else {
             setHistoricalPayments([]);
             setCurrentTermPayments([]);
          }
          
        })
        .catch(err => {
          setError(err.message || 'An error occurred while loading payment data.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, studentId]);

  // ... (useEffect for calculations is unchanged) ...
  useEffect(() => {
    if (loading || !student || !subjectsWithSchedules) return; 

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
    
    const tuition = manualEdit.tuition_fee ? (parseFloat(paymentData.tuition_fee) || 0) : newTuitionFee;
    const lab = manualEdit.laboratory_fee ? (parseFloat(paymentData.laboratory_fee) || 0) : newLaboratoryFee;
    const bundled = manualEdit.bundled_program_fee ? (parseFloat(paymentData.bundled_program_fee) || 0) : newBundledProgramFee;

    const total = prevAccount + tuition + lab + miscFee + otherFee + bundled + regFee;
    const newTotalAmount = manualEdit.total_amount ? (parseFloat(paymentData.total_amount) || 0) : total;

    const newDiscountDeduction = manualEdit.discount_deduction
      ? (parseFloat(paymentData.discount_deduction) || 0)
      : newTotalAmount * (discountPercent / 100);

    const balanceAfterDownPayment = newTotalAmount - newDiscountDeduction - paymentAmount; 
    
    const newTermPayment = balanceAfterDownPayment > 0 ? balanceAfterDownPayment / 4 : 0;
    
    const totalCurrentPayments = currentTermPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    
    const newRemainingAmount = balanceAfterDownPayment - totalCurrentPayments;

    setPaymentData(prev => ({
        ...prev,
        tuition_fee: manualEdit.tuition_fee ? prev.tuition_fee : newTuitionFee.toFixed(2),
        laboratory_fee: manualEdit.laboratory_fee ? prev.laboratory_fee : newLaboratoryFee.toFixed(2),
        bundled_program_fee: manualEdit.bundled_program_fee ? prev.bundled_program_fee : newBundledProgramFee.toFixed(2),
        total_amount: manualEdit.total_amount ? prev.total_amount : newTotalAmount.toFixed(2),
        discount_deduction: manualEdit.discount_deduction ? prev.discount_deduction : newDiscountDeduction.toFixed(2),
        remaining_amount: newRemainingAmount.toFixed(2),
        term_payment: manualEdit.term_payment ? prev.term_payment : newTermPayment.toFixed(2),
    }));

  }, [
    loading, 
    student, 
    subjectsWithSchedules, 
    paymentData.previous_account, 
    paymentData.registration_fee, 
    paymentData.miscellaneous_fee, 
    paymentData.other_fees, 
    paymentData.payment_amount, 
    paymentData.discount,
    manualEdit,
    currentTermPayments 
  ]);

  // ... (handlePaymentInputChange, handlePaymentDateChange, handleTermPaymentInputChange, handleTermPaymentDateChange, handleAddTermPayment, handleRemoveTermPayment are all unchanged) ...
  const handlePaymentInputChange = (field, value) => {
    if (field === 'remaining_amount') return; 
    setPaymentData(prev => ({ ...prev, [field]: value }));
    if (Object.keys(manualEdit).includes(field)) {
      setManualEdit(prev => ({ ...prev, [field]: true }));
    }
  };
  const handlePaymentDateChange = (dateString) => {
    if (!dateString) { setPaymentData(prev => ({ ...prev, payment_date: '' })); return; }
    const formattedDate = new Date(dateString).toISOString().split('T')[0];
    setPaymentData(prev => ({ ...prev, payment_date: formattedDate }));
  };
  const handleTermPaymentInputChange = (field, value) => {
    setTermPaymentInput(prev => ({ ...prev, [field]: value }));
  };
  const handleTermPaymentDateChange = (dateString) => {
    if (!dateString) { setTermPaymentInput(prev => ({ ...prev, payment_date: '' })); return; }
    const formattedDate = new Date(dateString).toISOString().split('T')[0];
    setTermPaymentInput(prev => ({ ...prev, payment_date: formattedDate }));
  };
  const handleAddTermPayment = () => {
    const amount = parseFloat(termPaymentInput.amount);
    if (!amount || amount <= 0) {
      setValidationModal({ isOpen: true, message: 'Please enter a valid amount for the term payment.' });
      return;
    }
    if (!termPaymentInput.payment_date) {
      setValidationModal({ isOpen: true, message: 'Please select a date for the term payment.' });
      return;
    }
    setCurrentTermPayments(prev => [...prev, { ...termPaymentInput, id: Date.now() }]);
    setTermPaymentInput({
      payment_date: new Date().toISOString().split('T')[0],
      or_number: '',
      amount: ''
    });
  };
  const handleRemoveTermPayment = (id) => {
    setCurrentTermPayments(prev => prev.filter(p => p.id !== id));
  };

  // ✅ 4. Update handleSavePayment to use the new props
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
        pre_enrolled_student_id: student.id,
        enrollment_code_id: student.enrollment_code?.id || student.enrollment_code_id,
        term_payments: currentTermPayments.map(({ id, ...rest }) => rest) 
      };
      
      const response = await paymentAPI.create(paymentPayload); 

      if (response.success) {
        // ✅ Call the onSaveSuccess prop (it will close the modal AND show the alert)
        onSaveSuccess('Payment information saved successfully!');
      } else {
        // ✅ Call the onSaveError prop (it will show the error alert)
        onSaveError(response.message || 'Failed to save payment information.');
      }
    } catch (error) {
      // ✅ Call the onSaveError prop
      onSaveError(error.message || 'An error occurred while saving payment.');
      console.error('Payment save error:', error);
    } finally {
      setPaymentSaving(false);
    }
  };
  // --- END OF FIX ---

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* ✅ 5. The SuccessAlert component is GONE from here */}
      <ValidationErrorModal isOpen={validationModal.isOpen} message={validationModal.message} onClose={() => setValidationModal({ isOpen: false, message: '' })} />
      
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* ... (Rest of the modal JSX is unchanged) ... */}
        {/* Header */}
        <div className="sticky top-0 bg-red-800 text-white z-10 flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            Payment Information {student ? `- ${student.last_name}, ${student.first_name}` : ''}
          </h2>
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
              {/* --- CARD 1: Main Payment Information --- */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-red-200">
                <h3 className="text-lg font-medium mb-4 text-black flex items-center">PAYMENT INFORMATION</h3>
                <div className="space-y-6">
                  {/* Fee Structure */}
                  <div>
                    <h4 className="text-md font-medium mb-3 text-gray-700">Fee Structure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Previous Account</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.previous_account} onChange={(e) => handlePaymentInputChange('previous_account', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.registration_fee} onChange={(e) => handlePaymentInputChange('registration_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Tuition Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.tuition_fee} onChange={(e) => handlePaymentInputChange('tuition_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.laboratory_fee} onChange={(e) => handlePaymentInputChange('laboratory_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.miscellaneous_fee} onChange={(e) => handlePaymentInputChange('miscellaneous_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Other Fees</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.other_fees} onChange={(e) => handlePaymentInputChange('other_fees', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Bundled Program Fee</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.bundled_program_fee} onChange={(e) => handlePaymentInputChange('bundled_program_fee', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                    </div>
                  </div>
                  {/* Payment Details */}
                  <div>
                    <h4 className="text-md font-medium mb-3 text-gray-700">Payment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.total_amount} onChange={(e) => handlePaymentInputChange('total_amount', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (Down Payment)</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.payment_amount} onChange={(e) => handlePaymentInputChange("payment_amount", e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
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

                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Term Payment (Calculated)</label><div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={paymentData.term_payment} onChange={(e) => handlePaymentInputChange('term_payment', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none" placeholder="0.00" min="0" step="0.01" /></div></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label><CustomCalendar value={paymentData.payment_date} onChange={handlePaymentDateChange} placeholder="Select Payment Date" /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- CARD 2: PAYMENT HISTORY (READ-ONLY) --- */}
              {historicalPayments.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                  <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-gray-500" />
                    Payment History
                  </h3>
                  <div className="divide-y divide-gray-200 rounded-lg border">
                      {historicalPayments.map((payment, index) => (
                        <div key={payment.id || index} className={`p-3 flex justify-between items-center ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex gap-4">
                            <span className="font-mono text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</span>
                            <span className="text-sm font-mono text-gray-800">OR #: {payment.or_number || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium font-mono text-green-700">
                              ₱{parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              )}

              {/* --- CARD 3: CURRENT TERM PAYMENTS (EDITABLE) --- */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-medium mb-4 text-black flex items-center">
                  Manage Term Payments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</Label>
                    <CustomCalendar 
                      value={termPaymentInput.payment_date} 
                      onChange={handleTermPaymentDateChange} 
                      placeholder="Select Date" />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">OR #</Label>
                    <Input 
                      type="text" 
                      value={termPaymentInput.or_number} 
                      onChange={(e) => handleTermPaymentInputChange('or_number', e.target.value)} 
                      placeholder="Official Receipt #" />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                      <Input 
                        type="number" 
                        value={termPaymentInput.amount} 
                        onChange={(e) => handleTermPaymentInputChange('amount', e.target.value)} 
                        className="pl-8" 
                        placeholder="0.00" min="0" step="0.01" />
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <Button onClick={handleAddTermPayment} className="w-full bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payment
                    </Button>
                  </div>
                </div>

                {/* Display added/editable term payments */}
                {currentTermPayments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-3 text-gray-700">
                      Payments for This Term
                    </h4>
                    <div className="divide-y divide-gray-200 rounded-lg border">
                      {currentTermPayments.map((payment, index) => (
                        <div key={payment.id || Date.now() + index} className={`p-3 flex justify-between items-center ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex gap-4">
                            <span className="font-mono text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</span>
                            <span className="text-sm font-mono text-gray-800">OR #: {payment.or_number || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium font-mono text-gray-900">
                              ₱{parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8" onClick={() => handleRemoveTermPayment(payment.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* --- END OF UI --- */}


              {/* --- SAVE BUTTON --- */}
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
                      <span>Save All Payment Data</span>
                    </>
                  )}
                </Button>
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

export default TermPaymentModal;