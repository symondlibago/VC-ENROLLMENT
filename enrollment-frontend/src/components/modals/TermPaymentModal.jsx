import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { enrollmentAPI, paymentAPI } from '../../services/api'; 
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SuccessAlert from './SuccessAlert'; 
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

const TermPaymentModal = ({ isOpen, onClose, studentId }) => {
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
  const [addedTermPayments, setAddedTermPayments] = useState([]);

  const [manualEdit, setManualEdit] = useState({
    tuition_fee: false,
    laboratory_fee: false,
    bundled_program_fee: false,
    total_amount: false,
    discount_deduction: false,
    remaining_amount: false, // This will always be false
    term_payment: false,
  });

  const [paymentSaving, setPaymentSaving] = useState(false);
  const [alert, setAlert] = useState({ isVisible: false, message: '', type: 'success' });
  const [validationModal, setValidationModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      // Reset states
      setPaymentData(defaultPaymentState);
      setAddedTermPayments([]);
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
      const studentDetailsPromise = enrollmentAPI.getStudentDetails(studentId)
        .then(res => {
          if (res.success) {
            setStudent(res.data.student);
            setSubjectsWithSchedules(res.data.subjects || []);
          } else {
            throw new Error('Failed to load student details');
          }
        });

      // Fetch existing payment data
      const paymentDataPromise = paymentAPI.getByStudentId(studentId)
        .then(res => {
          if (res.success) {
            setPaymentData(res.data);
            setAddedTermPayments(res.data.term_payments || []);

            // ✅ --- FIX 1: ---
            // We set 'remaining_amount' to false. It MUST always be
            // calculated and should never be "locked".
            setManualEdit({
              tuition_fee: true,
              laboratory_fee: true,
              bundled_program_fee: true,
              total_amount: true,
              discount_deduction: true,
              remaining_amount: false, // <-- MUST BE FALSE
              term_payment: true,
            });
          }
        })
        .catch(err => {
          if (err.message && err.message.includes('404')) {
            // No payment record found, just continue.
          } else {
            throw new Error('Failed to load payment data');
          }
        });

      // Wait for all data
      Promise.all([studentDetailsPromise, paymentDataPromise])
        .catch(err => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, studentId]);


  // ✅ --- MODIFIED CALCULATION useEffect ---
  useEffect(() => {
    if (!student || !subjectsWithSchedules) return;

    // --- 1. Calculate base fees ---
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
    const paymentAmount = parseFloat(paymentData.payment_amount) || 0; // This is the Down Payment
    const discountPercent = parseFloat(paymentData.discount) || 0;
    
    const tuition = manualEdit.tuition_fee ? (parseFloat(paymentData.tuition_fee) || 0) : newTuitionFee;
    const lab = manualEdit.laboratory_fee ? (parseFloat(paymentData.laboratory_fee) || 0) : newLaboratoryFee;
    const bundled = manualEdit.bundled_program_fee ? (parseFloat(paymentData.bundled_program_fee) || 0) : newBundledProgramFee;

    // --- 2. Calculate Total and Discount ---
    const total = prevAccount + tuition + lab + miscFee + otherFee + bundled + regFee;
    const newTotalAmount = manualEdit.total_amount ? (parseFloat(paymentData.total_amount) || 0) : total;

    const newDiscountDeduction = manualEdit.discount_deduction
      ? (parseFloat(paymentData.discount_deduction) || 0)
      : newTotalAmount * (discountPercent / 100);

    // --- 3. Calculate "Sticky" Term Payment ---
    const balanceAfterDownPayment = newTotalAmount - newDiscountDeduction - paymentAmount; 
    
    const newTermPayment = balanceAfterDownPayment > 0 ? balanceAfterDownPayment / 4 : 0;

    // --- 4. Calculate Final Remaining Amount ---
    const totalAddedTermPayments = addedTermPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
    
    // This is now the single source of truth for remaining_amount
    const newRemainingAmount = balanceAfterDownPayment - totalAddedTermPayments;

    // --- 5. Set State ---
    setPaymentData(prev => ({
        ...prev,
        // Update fees
        tuition_fee: manualEdit.tuition_fee ? prev.tuition_fee : newTuitionFee.toFixed(2),
        laboratory_fee: manualEdit.laboratory_fee ? prev.laboratory_fee : newLaboratoryFee.toFixed(2),
        bundled_program_fee: manualEdit.bundled_program_fee ? prev.bundled_program_fee : newBundledProgramFee.toFixed(2),
        // Update totals
        total_amount: manualEdit.total_amount ? prev.total_amount : newTotalAmount.toFixed(2),
        discount_deduction: manualEdit.discount_deduction ? prev.discount_deduction : newDiscountDeduction.toFixed(2),
        
        // ✅ --- FIX 2: ---
        // Always set remaining_amount to the new calculated value.
        // We remove the check for manualEdit.remaining_amount.
        remaining_amount: newRemainingAmount.toFixed(2),
        
        // Set term_payment to the "sticky" value (calculated in step 3)
        term_payment: manualEdit.term_payment ? prev.term_payment : newTermPayment.toFixed(2),
    }));

  }, [
    student, 
    subjectsWithSchedules, 
    paymentData.previous_account, 
    paymentData.registration_fee, 
    paymentData.miscellaneous_fee, 
    paymentData.other_fees, 
    paymentData.payment_amount, // Down payment
    paymentData.discount,
    manualEdit,
    addedTermPayments // Re-run when this list changes
  ]);
  // --- END MODIFIED useEffect ---

  const handlePaymentInputChange = (field, value) => {
    // Prevent manual editing of remaining_amount
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
    // Use Date.now() as a temporary key for new items
    setAddedTermPayments(prev => [...prev, { ...termPaymentInput, id: Date.now() }]);
    setTermPaymentInput({
      payment_date: new Date().toISOString().split('T')[0],
      or_number: '',
      amount: ''
    });
  };

  const handleRemoveTermPayment = (id) => {
    setAddedTermPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleSavePayment = async () => {
    if (paymentData.registration_fee === '' || parseFloat(paymentData.registration_fee) < 0) { 
      setValidationModal({ isOpen: true, message: 'Registration Fee is required.' }); return;
    }
    if (paymentData.payment_amount === '' || parseFloat(paymentData.payment_amount) < 0) { 
      setValidationModal({ isOpen: true, message: 'Payment Amount (Down Payment) is required.' }); return;
    }
    if (paymentData.total_amount === '' || parseFloat(paymentData.total_amount) < 0) { 
      setValidationModal({ isOpen: true, message: 'Total Amount is required.' }); return;
    }
    if (!paymentData.payment_date) {
      setValidationModal({ isOpen: true, message: 'Payment Date is required.' }); return;
    }

    try {
      setPaymentSaving(true);
      const paymentPayload = {
        ...paymentData,
        pre_enrolled_student_id: student.id,
        enrollment_code_id: student.enrollment_code?.id || student.enrollment_code_id,
        
        term_payments: addedTermPayments.map(({ id, ...rest }) => rest) 
      };
      
      const response = await paymentAPI.create(paymentPayload); 
      if (response.success) {
        setAlert({ isVisible: true, message: 'Payment information saved successfully!', type: 'success' });
        onClose(); 
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

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <SuccessAlert isVisible={alert.isVisible} message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, isVisible: false })} />
      <ValidationErrorModal isOpen={validationModal.isOpen} message={validationModal.message} onClose={() => setValidationModal({ isOpen: false, message: '' })} />
      
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                      
                      {/* ✅ --- FIX 3: ---
                          Added readOnly and bg-gray-100 to this input.
                          It is now a purely calculated field.
                      */}
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

              {/* --- CARD 2: NEW TERM PAYMENT SECTION --- */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-medium mb-4 text-black flex items-center">Add Term Payment (Installment)</h3>
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

                {/* Display added term payments */}
                {addedTermPayments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-3 text-gray-700">Added Term Payments</h4>
                    <div className="divide-y divide-gray-200 rounded-lg border">
                      {addedTermPayments.map((payment, index) => (
                        <div key={payment.id} className={`p-3 flex justify-between items-center ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
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