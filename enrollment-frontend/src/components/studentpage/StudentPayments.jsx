// src/components/studentpage/StudentPayments.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Loader2, CreditCard, XCircle } from 'lucide-react';
import { paymentAPI } from '../../services/api'; 
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Re-defining the default state structure for clarity
const defaultPaymentState = {
  previous_account: 0,
  registration_fee: 0,
  tuition_fee: 0,
  laboratory_fee: 0,
  miscellaneous_fee: 0,
  other_fees: 0,
  bundled_program_fee: 0,
  total_amount: 0,
  payment_amount: 0,
  discount: 0,
  discount_deduction: 0,
  remaining_amount: 0,
  term_payment: 0,
  advance_payment: 0, 
  payment_date: null,
};

// Helper function to format currency
const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const StudentPayments = () => {
    const [loading, setLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);
    const [paymentData, setPaymentData] = useState(defaultPaymentState);
    const [historicalPayments, setHistoricalPayments] = useState([]); 
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPaymentData = async () => {
            setLoading(true);
            setError(null);
            try {
                // This calls the new protected route: /api/student/payment-history
                const response = await paymentAPI.getPaymentForAuthenticatedStudent(); 

                if (response.success && response.data) {
                    const payment = response.data;
                    const student = payment.pre_enrolled_student;

                    setPaymentData(prev => ({ 
                        ...prev, 
                        ...payment 
                    }));
                    setStudentInfo(student);

                    // Separate term payments from all payments (no need to filter for current term for read-only view)
                    setHistoricalPayments(payment.term_payments || []);
                    
                } else {
                    // Handle the expected "No payment record found" (404) error gracefully
                    setError(response.message || 'No payment record found for this enrollment.');
                    setPaymentData(defaultPaymentState);
                    setHistoricalPayments([]);
                }
            } catch (err) {
                // Handle network or unexpected errors
                setError(err.message || 'An error occurred while loading payment data.');
            } finally {
                setLoading(false);
            }
        };

        // Note: You must ensure 'getPaymentForAuthenticatedStudent' is defined in your api.js
        if (paymentAPI.getPaymentForAuthenticatedStudent) {
             fetchPaymentData();
        } else {
             setError("API function 'getPaymentForAuthenticatedStudent' is not defined. Check your services/api.js file.");
             setLoading(false);
        }
       
    }, []);

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
    };

    if (loading) {
        return (
            <div className="p-6 h-[70vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <span className="ml-3 text-lg text-gray-600">Loading payment details...</span>
            </div>
        );
    }
    
    // Custom error display for a friendlier look
    if (error && error !== 'No payment record found for this enrollment.') {
         return (
            <div className="p-6 h-[70vh] flex flex-col items-center justify-center text-center">
                <XCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800">Error Loading Data</h3>
                <p className="text-gray-600 mt-2">{error}</p>
                <p className="text-sm text-gray-500 mt-1">Please contact the administration if the issue persists.</p>
            </div>
        );
    }

    return (
        <motion.div
            className="p-6 space-y-8"
            variants={pageVariants}
            initial="initial"
            animate="animate"
        >
            <h1 className="text-3xl font-bold text-gray-900 border-b pb-3 mb-6 flex items-center">
                <CreditCard className="w-7 h-7 mr-3 text-red-600" /> My Financial Statement
            </h1>
            
            {error === 'No payment record found for this enrollment.' ? (
                <Card className="shadow-lg border-2 border-red-300">
                    <CardHeader>
                        <CardTitle className="text-xl text-red-600">No Payment Data Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">The Cashier has not yet created your enrollment payment record for the current term.</p>
                        <p className="text-gray-500 mt-2">Please check back later or coordinate with the Cashier's office.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* --- CARD 1: Current Balance Summary --- */}
                    <Card className="shadow-lg lg:col-span-1 border-2 border-green-400 bg-green-50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-700">Current Remaining Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-4xl font-bold font-mono ${parseFloat(paymentData.remaining_amount) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                                ₱{formatCurrency(paymentData.remaining_amount)}
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                                {parseFloat(paymentData.advance_payment) > 0 ? 
                                    `Includes ₱${formatCurrency(paymentData.advance_payment)} in Advance Payment/Credit.` : 
                                    'All payments posted for this calculation.'
                                }
                            </p>
                            <div className="mt-4 text-sm text-gray-600">
                                <p><strong>Total Due:</strong> <span className="font-mono">₱{formatCurrency(paymentData.total_amount)}</span></p>
                                <p><strong>Total Paid:</strong> <span className="font-mono">₱{formatCurrency(paymentData.payment_amount + historicalPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0))}</span></p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* --- CARD 2: Fee Structure (Expanded List) --- */}
                    <Card className="shadow-lg lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg text-gray-800">Enrollment Fee Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {[
                                { label: 'Previous Account', value: paymentData.previous_account, key: 'previous_account', color: 'text-red-600' },
                                { label: 'Registration Fee', value: paymentData.registration_fee, key: 'registration_fee' },
                                { label: 'Tuition Fee', value: paymentData.tuition_fee, key: 'tuition_fee' },
                                { label: 'Laboratory Fee', value: paymentData.laboratory_fee, key: 'laboratory_fee' },
                                { label: 'Miscellaneous Fee', value: paymentData.miscellaneous_fee, key: 'miscellaneous_fee' },
                                { label: 'Other Fees', value: paymentData.other_fees, key: 'other_fees' },
                                { label: 'Bundled Program Fee', value: paymentData.bundled_program_fee, key: 'bundled_program_fee' },
                                { label: 'Down Payment/Initial', value: paymentData.payment_amount, key: 'payment_amount', color: 'text-green-600' },
                                { label: 'Advance Payment/Credit', value: paymentData.advance_payment, key: 'advance_payment' },
                                { label: 'Discount (%)', value: `${paymentData.discount || 0}%`, key: 'discount' },
                                { label: 'Discount Deduction', value: paymentData.discount_deduction, key: 'discount_deduction', color: 'text-green-600' },
                                { label: 'Remaining Balance', value: paymentData.remaining_amount, key: 'remaining_amount', color: 'text-red-600', isBold: true },
                                { label: 'Term Payment', value: paymentData.term_payment, key: 'term_payment', color: 'text-red-600', isBold: true },
                                { label: 'Total Assessed Amount', value: paymentData.total_amount, key: 'total_amount', color: 'text-blue-600' },
                            ].map(({ label, value, key, color, isBold }) => (
                                <div key={key} className="space-y-1 p-2 bg-gray-50 rounded-md">
                                    <p className="text-xs font-medium text-gray-500">{label}</p>
                                    <p className={`text-base font-mono font-${isBold ? 'bold' : 'medium'} ${color || 'text-gray-900'}`}>
                                        {key !== 'discount' && '₱'}
                                        {key === 'discount' ? value : formatCurrency(value)}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* --- CARD 3: Payment History --- */}
                    <Card className="shadow-lg lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-lg text-gray-800 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-red-600" />
                                Term Payment History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {historicalPayments.length > 0 ? (
                                <div className="max-h-[500px] overflow-y-auto border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OR Number</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {historicalPayments
                                                .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date)) // Sort by date
                                                .map((payment, index) => (
                                                    <tr key={payment.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                                            {new Date(payment.payment_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                            {payment.or_number || 'N/A'}
                                                        </td>
                                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {payment.year} ({payment.semester})
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-green-700 font-mono">
                                                            ₱{formatCurrency(payment.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border">
                                    <p>No individual term payments recorded yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            )}
        </motion.div>
    );
};

export default StudentPayments;