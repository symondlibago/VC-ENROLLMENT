import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2, CheckCircle, Clock, GraduationCap, Edit3, Lock } from 'lucide-react'; 
import { enrollmentAPI, paymentAPI } from '../../services/api'; 
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ValidationErrorModal from './ValidationErrorModal';
import CustomCalendar from '../layout/CustomCalendar';
import DownloadExamPermit from '../layout/DownloadExamPermit'; 
import DownloadCOR from '../layout/DownloadCOR';

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
  discount: '',
  discount_deduction: 0,
  remaining_amount: 0,
  term_payment: 0,
  payment_date: new Date().toISOString().split('T')[0],
  advance_payment: 0, 
};

const TermPaymentModal = ({ isOpen, onClose, studentId, onSaveSuccess, onSaveError }) => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(defaultPaymentState);
  const [isEditing, setIsEditing] = useState(false); 
  
  const [termPaymentInput, setTermPaymentInput] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    or_number: '',
    amount: ''
  });

  const [historicalPayments, setHistoricalPayments] = useState([]); 
  const [currentTermPayments, setCurrentTermPayments] = useState([]); 
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [validationModal, setValidationModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setIsEditing(false);
      setPaymentData(defaultPaymentState);
      setHistoricalPayments([]);
      setCurrentTermPayments([]);
      setTermPaymentInput({
        payment_date: new Date().toISOString().split('T')[0],
        or_number: '',
        amount: ''
      });

      const studentDetailsPromise = enrollmentAPI.getStudentDetails(studentId);
      
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
            currentStudent.subjects = studentRes.data.subjects || []; 
            setStudent(currentStudent);
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
        })
        .catch(err => {
          setError(err.message || 'An error occurred while loading payment data.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, studentId]);

  useEffect(() => {
    if (loading) return; 

    const prevAccount = parseFloat(paymentData.previous_account) || 0;
    const regFee = parseFloat(paymentData.registration_fee) || 0;
    const tuition = parseFloat(paymentData.tuition_fee) || 0;
    const lab = parseFloat(paymentData.laboratory_fee) || 0;
    const misc = parseFloat(paymentData.miscellaneous_fee) || 0;
    const other = parseFloat(paymentData.other_fees) || 0;
    const bundled = parseFloat(paymentData.bundled_program_fee) || 0;

    const calculatedTotalAmount = prevAccount + regFee + tuition + lab + misc + other + bundled;
    
    const downPayment = parseFloat(paymentData.payment_amount) || 0;
    const discountDeduction = parseFloat(paymentData.discount_deduction) || 0;
    
    const balanceAfterDownPayment = calculatedTotalAmount - discountDeduction - downPayment;
    const totalCurrentPayments = currentTermPayments.reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);

    let newRemainingAmount = balanceAfterDownPayment - totalCurrentPayments;
    let calculatedNewAdvance = 0; 
    
    if (newRemainingAmount < 0) {
        calculatedNewAdvance = Math.abs(newRemainingAmount);
        newRemainingAmount = 0;
    }

    setPaymentData(prev => {
      const shouldUpdateTerm = currentTermPayments.length === 0 || isEditing;
    
      return {
        ...prev,
        total_amount: calculatedTotalAmount.toFixed(2),
        remaining_amount: newRemainingAmount.toFixed(2),
        advance_payment: calculatedNewAdvance.toFixed(2),
        term_payment: shouldUpdateTerm 
            ? (newRemainingAmount > 0 ? (newRemainingAmount / 4).toFixed(2) : "0.00")
            : prev.term_payment 
    };
});

  }, [
    loading, 
    paymentData.previous_account,
    paymentData.registration_fee,
    paymentData.tuition_fee,
    paymentData.laboratory_fee,
    paymentData.miscellaneous_fee,
    paymentData.other_fees,
    paymentData.bundled_program_fee,
    paymentData.payment_amount, 
    paymentData.discount_deduction,
    currentTermPayments
  ]);

  const handlePaymentInputChange = (field, value) => {
    if (field === 'remaining_amount' || field === 'advance_payment' || field === 'term_payment') return;
    setPaymentData(prev => ({ ...prev, [field]: value }));
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
        onSaveSuccess('Payment information saved successfully!');
        setIsEditing(false);
      } else {
        onSaveError(response.message || 'Failed to save payment information.');
      }
    } catch (error) {
      onSaveError(error.message || 'An error occurred while saving payment.');
    } finally {
      setPaymentSaving(false);
    }
  };

  if (!isOpen) return null;
  
  const inputStyle = (isEditableField = true) => `
    w-full pl-8 pr-3 py-2 border-2 rounded-md transition-all duration-200 focus:outline-none
    ${isEditing && isEditableField 
      ? 'border-blue-400 bg-white shadow-sm ring-1 ring-blue-100' 
      : 'border-gray-300 bg-gray-100 cursor-not-allowed'}
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <ValidationErrorModal isOpen={validationModal.isOpen} message={validationModal.message} onClose={() => setValidationModal({ isOpen: false, message: '' })} />
      
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-800 text-white z-10 flex items-center justify-between p-4 border-b shadow-md">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-xl font-semibold">
              Payment Information {student ? `- ${student.last_name}, ${student.first_name}` : ''}
            </h2>
            
            {student?.scholarship && (
              <div className="flex items-center bg-yellow-500/20 text-yellow-100 text-xs font-semibold px-3 py-1 rounded-full border border-yellow-500/40 backdrop-blur-sm shadow-sm">
                <GraduationCap className="w-3 h-3 mr-1.5" />
                {student.scholarship} Scholar
              </div>
            )}
          </div>
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                <div className={`p-4 rounded-lg border-2 transition-colors ${isEditing ? 'bg-blue-50/30 border-blue-200' : 'bg-gray-50 border-red-200'}`}>
                  <h3 className="text-lg font-medium mb-4 text-black flex items-center">
                    {isEditing ? 'EDITING PAYMENT DETAILS' : 'PAYMENT INFORMATION'}
                    {isEditing && <span className="ml-2 text-xs text-blue-600 animate-pulse">(Auto-calculating active)</span>}
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium mb-3 text-gray-700">Fee Structure</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Previous Account', key: 'previous_account' },
                          { label: 'Registration Fee', key: 'registration_fee' },
                          { label: 'Tuition Fee', key: 'tuition_fee' },
                          { label: 'Laboratory Fee', key: 'laboratory_fee' },
                          { label: 'Miscellaneous Fee', key: 'miscellaneous_fee' },
                          { label: 'Other Fees', key: 'other_fees' }
                        ].map((field) => (
                          <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                              <input 
                                type="number" 
                                value={paymentData[field.key]} 
                                onChange={(e) => handlePaymentInputChange(field.key, e.target.value)}
                                readOnly={!isEditing} 
                                className={inputStyle()} 
                              />
                            </div>
                          </div>
                        ))}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bundled Program Fee</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                            <input 
                              type="number" 
                              value={paymentData.bundled_program_fee} 
                              onChange={(e) => handlePaymentInputChange('bundled_program_fee', e.target.value)}
                              readOnly={!isEditing} 
                              className={inputStyle()} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-medium mb-3 text-gray-700">Payment Details & Totals</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                            <input 
                              type="number" 
                              value={paymentData.total_amount} 
                              onChange={(e) => handlePaymentInputChange('total_amount', e.target.value)}
                              readOnly={!isEditing} 
                              className={inputStyle()} 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                            <input 
                              type="number" 
                              value={paymentData.payment_amount} 
                              onChange={(e) => handlePaymentInputChange('payment_amount', e.target.value)}
                              readOnly={!isEditing} 
                              className={inputStyle()} 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                          <input 
                            type="number" 
                            value={paymentData.discount} 
                            onChange={(e) => handlePaymentInputChange('discount', e.target.value)}
                            readOnly={!isEditing} 
                            className={inputStyle().replace('pl-8', 'pl-3')} 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Deduction</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                            <input 
                              type="number" 
                              value={paymentData.discount_deduction} 
                              onChange={(e) => handlePaymentInputChange('discount_deduction', e.target.value)}
                              readOnly={!isEditing} 
                              className={inputStyle()} 
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Balance</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                            <input type="number" value={paymentData.remaining_amount} readOnly className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">Advance Payment (Credit)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 text-sm">₱</span>
                            <input type="number" value={paymentData.advance_payment} readOnly className={`w-full pl-8 pr-3 py-2 border-2 rounded-md ${parseFloat(paymentData.advance_payment) > 0 ? 'border-green-200 bg-green-50 text-green-800 font-bold' : 'border-gray-300 bg-gray-100'}`} />
                          </div>
                        </div>
                        
                        {/* ALIGNED HORIZONTALLY */}
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Term Payment (Calculated)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span>
                            <input type="number" value={paymentData.term_payment} readOnly className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md bg-gray-100" />
                          </div>
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                          <CustomCalendar 
                            value={paymentData.payment_date} 
                            onChange={handlePaymentDateChange} 
                            placeholder="Select Date" 
                            disabled={!isEditing} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                  <h3 className="text-lg font-medium mb-4 text-gray-700 flex items-center"><Clock className="w-5 h-5 mr-2 text-gray-500" />Payment History</h3>
                  {historicalPayments.length > 0 ? (
                    <div className="divide-y divide-gray-200 rounded-lg border max-h-[60vh] overflow-y-auto">
                        {historicalPayments.map((payment, index) => (
                          <div key={payment.id || index} className={`p-3 flex justify-between items-center ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <div className="flex gap-4">
                              <span className="font-mono text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</span>
                              <span className="text-sm font-mono text-gray-800">OR #: {payment.or_number || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-mono text-green-700">₱{parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                  ) : (<div className="text-center py-12 text-gray-500"><p>No previous payment history found.</p></div>)}
                </div>
              </div> 

              <div className="bg-gray-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-medium mb-4 text-black flex items-center">Manage Current Term Payments</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</Label>
                    <CustomCalendar value={termPaymentInput.payment_date} onChange={handleTermPaymentDateChange} placeholder="Select Date"/>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">OR #</Label>
                    <input type="text" value={termPaymentInput.or_number} onChange={(e) => handleTermPaymentInputChange('or_number', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none bg-white" placeholder="e.g 12345"/>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Amount</Label>
                    <div className="relative"><span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₱</span><input type="number" value={termPaymentInput.amount} onChange={(e) => handleTermPaymentInputChange('amount', e.target.value)} className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none bg-white" placeholder="0.00"/></div>
                  </div>
                  <div className="md:col-span-1"><Button onClick={handleAddTermPayment} className="w-full bg-green-600 hover:bg-green-700 cursor-pointer h-11"><Plus className="w-4 h-4 mr-2" />Add Payment</Button></div>
                </div>

                {currentTermPayments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-3 text-gray-700">Payments for This Term</h4>
                    <div className="divide-y divide-gray-200 rounded-lg border">
                      {currentTermPayments.map((payment, index) => (
                        <div key={payment.id || Date.now() + index} className={`p-3 flex justify-between items-center ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex gap-4">
                            <span className="font-mono text-sm text-gray-600">{new Date(payment.payment_date).toLocaleDateString()}</span>
                            <span className="text-sm font-mono text-gray-800">OR #: {payment.or_number || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono text-gray-900 font-bold">₱{parseFloat(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8" onClick={() => handleRemoveTermPayment(payment.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 gap-3">
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 h-9 rounded-md font-bold transition-all ${
                  isEditing 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white border border-gray-300'
                }`}
              >
                {isEditing ? <Lock size={16} /> : <Edit3 size={16} />}
                {isEditing ? 'Locked' : 'Edit Fields'}
              </Button>
                <DownloadExamPermit student={student} />
                <DownloadCOR 
                  student={student} // Ensure student.section_label is present here
                  subjectsWithSchedules={student?.subjects || []} 
                  paymentData={paymentData} 
                />
                <Button
                  onClick={handleSavePayment}
                  disabled={paymentSaving}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 flex items-center space-x-2 min-w-[180px]"
                >
                  {paymentSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save All Changes</span>
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