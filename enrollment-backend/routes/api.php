<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\UploadReceiptController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public authentication routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Schedule routes
    Route::apiResource('schedules', ScheduleController::class);
    Route::get('subjects/{subject}/schedules', [ScheduleController::class, 'getBySubject']);

    Route::post('enrollments/{id}/status', [EnrollmentController::class, 'updateApprovalStatus']);
    Route::post('enrollments/{id}/approval', [EnrollmentController::class, 'submitApproval']);
    Route::get('/enrolled-students', [EnrollmentController::class, 'getEnrolledStudents']);

    // Payment routes
    Route::apiResource('payments', PaymentController::class);

    // Section routes
    Route::apiResource('sections', SectionController::class);
    Route::post('sections/{section}/students', [SectionController::class, 'addStudents']);

    Route::get('enrollments', [EnrollmentController::class, 'getPreEnrolledStudents']);

});
    // Program routes
    Route::apiResource('programs', ProgramController::class);
    
    // Course routes
    Route::apiResource('courses', CourseController::class);

    // Subject routes
    Route::apiResource('subjects', SubjectController::class);
    Route::get('courses/{course}/subjects', [SubjectController::class, 'getByCourse']);
    
    // Enrollment routes
    Route::post('enrollments', [EnrollmentController::class, 'submitEnrollment']);
    Route::get('enrollments/code/{code}', [EnrollmentController::class, 'checkEnrollmentStatus']);
    Route::get('enrollments/{id}/details', [EnrollmentController::class, 'getPreEnrolledStudentDetails']);
    Route::get('enrollments/{id}', [EnrollmentController::class, 'getPreEnrolledStudentDetails']);

    // Upload Receipts
    Route::post('upload-receipts', [UploadReceiptController::class, 'store']);
    Route::get('upload-receipts/search-students', [UploadReceiptController::class, 'searchStudents']);
    