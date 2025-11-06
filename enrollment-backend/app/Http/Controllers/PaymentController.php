<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB; 
use App\Models\TermPayment;

class PaymentController extends Controller
{
    /**
     * Display a listing of payments.
     */
    public function index()
    {
        $payments = Payment::with(['preEnrolledStudent', 'enrollmentCode'])->get();
        return response()->json([
            'success' => true,
            'data' => $payments
        ]);
    }

    /**
     * Store a newly created payment.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pre_enrolled_student_id' => 'required|exists:pre_enrolled_students,id',
            'enrollment_code_id' => 'required|exists:enrollment_codes,id',
            'previous_account' => 'nullable|numeric|min:0',
            'registration_fee' => 'nullable|numeric|min:0',
            'tuition_fee' => 'nullable|numeric|min:0',
            'laboratory_fee' => 'nullable|numeric|min:0',
            'miscellaneous_fee' => 'nullable|numeric|min:0',
            'other_fees' => 'nullable|numeric|min:0',
            'bundled_program_fee' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'payment_amount' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'discount_deduction' => 'nullable|numeric|min:0',
            'remaining_amount' => 'nullable|numeric',
            'term_payment' => 'nullable|numeric|min:0',
            'payment_date' => 'nullable|date',
            'term_payments' => 'nullable|array',
            'term_payments.*.or_number' => 'nullable|string|max:255',
            'term_payments.*.amount' => 'required|numeric|min:0',
            'term_payments.*.payment_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // ✅ --- FIX: Use updateOrCreate ---
            // This finds a payment with the matching student ID and updates it.
            // If one doesn't exist, it creates it.
            $payment = Payment::updateOrCreate(
                [
                    // Key to find the record:
                    'pre_enrolled_student_id' => $request->input('pre_enrolled_student_id')
                ],
                [
                    // Data to update or create with:
                    // (We exclude term_payments and student_id from this part)
                    'enrollment_code_id' => $request->input('enrollment_code_id'),
                    'previous_account' => $request->input('previous_account'),
                    'registration_fee' => $request->input('registration_fee'),
                    'tuition_fee' => $request->input('tuition_fee'),
                    'laboratory_fee' => $request->input('laboratory_fee'),
                    'miscellaneous_fee' => $request->input('miscellaneous_fee'),
                    'other_fees' => $request->input('other_fees'),
                    'bundled_program_fee' => $request->input('bundled_program_fee'),
                    'total_amount' => $request->input('total_amount'),
                    'payment_amount' => $request->input('payment_amount'),
                    'discount' => $request->input('discount'),
                    'discount_deduction' => $request->input('discount_deduction'),
                    'remaining_amount' => $request->input('remaining_amount'),
                    'term_payment' => $request->input('term_payment'),
                    'payment_date' => $request->input('payment_date'),
                ]
            );
            
            // ✅ --- FIX: Delete old term payments ---
            // This prevents duplicates and makes the list an exact copy of what's in the modal.
            TermPayment::where('payment_id', $payment->id)->delete();
            
            // Check if any term payments were sent
            if ($request->has('term_payments') && is_array($request->term_payments)) {
                foreach ($request->term_payments as $termPaymentData) {
                    // Create a new TermPayment and link it to the (now correct) payment record
                    TermPayment::create([
                        'payment_id' => $payment->id,
                        'pre_enrolled_student_id' => $payment->pre_enrolled_student_id,
                        'or_number' => $termPaymentData['or_number'],
                        'amount' => $termPaymentData['amount'],
                        'payment_date' => $termPaymentData['payment_date'],
                    ]);
                }
            }

            DB::commit(); // All good, save changes

            return response()->json([
                'success' => true,
                'data' => $payment->load('termPayments') // Return updated payment
            ], 200); // 200 (OK) is better for an update

        } catch (\Exception $e) {
            DB::rollBack(); // Something went wrong, undo changes
            return response()->json([
                'success' => false,
                'message' => 'Failed to save payment.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getPaymentByStudent($student_id)
    {
        $payment = Payment::with('termPayments') // Eager load installments
                         ->where('pre_enrolled_student_id', $student_id)
                         ->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'No payment record found for this student.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    /**
     * Display the specified payment.
     */
    public function show($id)
    {
        $payment = Payment::with(['preEnrolledStudent', 'enrollmentCode'])->find($id);
        
        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    /**
     * Update the specified payment.
     */
    public function update(Request $request, $id)
    {
        $payment = Payment::find($id);
        
        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'previous_account' => 'numeric|min:0',
            'registration_fee' => 'numeric|min:0',
            'tuition_fee' => 'numeric|min:0',
            'laboratory_fee' => 'numeric|min:0',
            'miscellaneous_fee' => 'numeric|min:0',
            'other_fees' => 'numeric|min:0',
            'bundled_program_fee' => 'numeric|min:0',
            'total_amount' => 'numeric|min:0',
            'payment_amount' => 'numeric|min:0',
            'discount' => 'numeric|min:0',
            'discount_deduction' => 'numeric|min:0',
            'remaining_amount' => 'numeric',
            'term_payment' => 'numeric|min:0',
            'payment_date' => 'date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $payment->update($request->all());
        
        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    /**
     * Remove the specified payment.
     */
    public function destroy($id)
    {
        $payment = Payment::find($id);
        
        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $payment->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Payment deleted successfully'
        ]);
    }
}
