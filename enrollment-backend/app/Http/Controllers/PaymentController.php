<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $payment = Payment::create($request->all());
        
        return response()->json([
            'success' => true,
            'data' => $payment
        ], 201);
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
