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
use App\Http\Controllers\SubjectChangeRequestController;
use App\Http\Controllers\ShifteeRequestController;
use App\Http\Controllers\InstructorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ManagementController;
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
Route::post('/login/verify-pin', [AuthController::class, 'verifyPin']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

     // --- NEW: User Profile & Password Update Routes ---
     Route::put('/user/profile', [AuthController::class, 'updateProfile']);
     Route::put('/user/password', [AuthController::class, 'changePassword']);
     Route::post('/user/pin', [AuthController::class, 'updatePin']);
     Route::post('/user/profile/verify-email-change', [AuthController::class, 'verifyEmailChange']);
    
    // Schedule routes
    Route::apiResource('schedules', ScheduleController::class);
    Route::get('subjects/{subject}/schedules', [ScheduleController::class, 'getBySubject']);

    // Approval enrollment routes
    Route::post('enrollments/{id}/status', [EnrollmentController::class, 'updateApprovalStatus']);
    Route::post('enrollments/{id}/approval', [EnrollmentController::class, 'submitApproval']);
    Route::get('/enrolled-students', [EnrollmentController::class, 'getEnrolledStudents']);

    // Payment routes
    Route::apiResource('payments', PaymentController::class);

    // Section routes
    Route::apiResource('sections', SectionController::class);
    Route::post('sections/{section}/students', [SectionController::class, 'addStudents']);
    Route::delete('sections/{section}/students/{student}', [SectionController::class, 'removeStudent']);

    // Enrollment routes
    Route::get('enrollments', [EnrollmentController::class, 'getPreEnrolledStudents']);
    Route::put('enrollments/{id}/details', [EnrollmentController::class, 'updateStudentDetails']);
    Route::get('/students/{student}/grades', [EnrollmentController::class, 'getStudentGrades']);
    Route::get('/id-releasing/students', [EnrollmentController::class, 'getStudentsForIdReleasing']);
    Route::put('/id-releasing/students/{id}/status', [EnrollmentController::class, 'updateIdStatus']);
    Route::post('/id-releasing/students/bulk-status', [EnrollmentController::class, 'bulkUpdateIdStatus']);
    Route::post('/grades/update-batch', [EnrollmentController::class, 'updateStudentGrades']);

    // Routes for Continuing Student Enrollment
    Route::get('/enrolled-students/search', [EnrollmentController::class, 'searchEnrolledStudents']);
    Route::post('/enrollments/continuing', [EnrollmentController::class, 'submitContinuingEnrollment']);

    // --- NEW: STUDENT-SPECIFIC ROUTE ---
    Route::get('/student/enrolled-subjects', [EnrollmentController::class, 'getStudentEnrolledSubjects']);
    Route::get('/student/grades', [EnrollmentController::class, 'getAuthenticatedStudentGrades']);
    Route::get('/student/curriculum', [EnrollmentController::class, 'getStudentCurriculum']);
    Route::get('/student/schedule', [EnrollmentController::class, 'getStudentSchedule']);
    
    // Upload Receipts
    Route::get('upload-receipts', [UploadReceiptController::class, 'index']);

    // Subject Change Request
    Route::get('/students/search', [SubjectChangeRequestController::class, 'searchStudents']);
    Route::get('/students/{studentId}/subject-details', [SubjectChangeRequestController::class, 'getStudentSubjectDetails']);
    
    Route::get('/subject-change-requests', [SubjectChangeRequestController::class, 'index']);
    Route::post('/subject-change-requests', [SubjectChangeRequestController::class, 'store']);
    Route::get('/subject-change-requests/{id}', [SubjectChangeRequestController::class, 'show']);
    Route::post('/subject-change-requests/{id}/process', [SubjectChangeRequestController::class, 'processRequest']);

    // Shiftee Management Routes
    Route::get('/shifting/data', [ShifteeRequestController::class, 'getShiftingData']);
    Route::get('/shiftee-requests', [ShifteeRequestController::class, 'index']);
    Route::post('/shiftee-requests', [ShifteeRequestController::class, 'store']);
    Route::get('/shiftee-requests/{id}', [ShifteeRequestController::class, 'show']);
    Route::post('/shiftee-requests/{id}/process', [ShifteeRequestController::class, 'processRequest']);

    // Instructor routes
    Route::apiResource('instructors', InstructorController::class);
    Route::get('/instructor/roster', [InstructorController::class, 'getRoster']);
    Route::get('/instructor/schedule', [InstructorController::class, 'getSchedule']);
    Route::get('/instructor/gradeable-students', [InstructorController::class, 'getGradeableStudents']);
    Route::post('/instructor/grades/bulk-update', [InstructorController::class, 'bulkUpdateGrades']);

    // User routes
    Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);

    // Management routes
    Route::get('/management/grading-periods', [ManagementController::class, 'getGradingPeriods']);
    Route::post('/management/grading-periods', [ManagementController::class, 'updateGradingPeriods']);

});
    // Program routes
    Route::apiResource('programs', ProgramController::class);
    
    // Course routes
    Route::apiResource('courses', CourseController::class);

    // Subject routes
    Route::get('/subjects/search', [SubjectController::class, 'search']);
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

    // Reset Password
    Route::post('/forgot-password', [AuthController::class, 'sendPasswordResetOtp']);
    Route::post('/reset-password-with-otp', [AuthController::class, 'resetPasswordWithOtp']);

    // Reset PIN
    Route::post('/forgot-pin/send-otp', [AuthController::class, 'sendPinResetOtp']);
    Route::post('/forgot-pin/verify-otp', [AuthController::class, 'verifyPinResetOtp']);
    Route::post('/forgot-pin/reset-pin', [AuthController::class, 'resetPinWithToken']);