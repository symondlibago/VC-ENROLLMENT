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
use App\Http\Controllers\IncRecordController;
use App\Http\Controllers\CredentialRequestController;
use App\Http\Controllers\TranscriptController;
use App\Http\Controllers\StudentGradeExportController;
use App\Http\Controllers\UniformFabricController;
use App\Http\Controllers\IdReleasingController;
use App\Http\Controllers\SchoolYearController;
use App\Http\Controllers\ClearanceController;
use App\Http\Controllers\ClearanceRoleController;
use App\Http\Controllers\FacultyClearanceController;
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
Route::middleware('throttle:3,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/login/verify-pin', [AuthController::class, 'verifyPin']);

    // Reset Password
    Route::post('/forgot-password', [AuthController::class, 'sendPasswordResetOtp']);
    Route::post('/reset-password-with-otp', [AuthController::class, 'resetPasswordWithOtp']);

    // Reset PIN
    Route::post('/forgot-pin/send-otp', [AuthController::class, 'sendPinResetOtp']);
    Route::post('/forgot-pin/verify-otp', [AuthController::class, 'verifyPinResetOtp']);
    Route::post('/forgot-pin/reset-pin', [AuthController::class, 'resetPinWithToken']);
});

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
    // Grades for a hand-picked set of students, one row per subject (CSV export)
    Route::post('/enrolled-students/grades-export', StudentGradeExportController::class);

    // INC completion forms (cashier → instructor & program head → registrar)
    Route::get('/inc-records', [IncRecordController::class, 'index']);
    Route::post('/inc-records/payment-bulk', [IncRecordController::class, 'processPaymentBulk']);
    Route::post('/inc-records/{incRecord}/payment', [IncRecordController::class, 'processPayment']);
    Route::post('/inc-records/{incRecord}/approve', [IncRecordController::class, 'approve']);
    Route::post('/inc-records/{incRecord}/revoke', [IncRecordController::class, 'revokeApproval']);

    // Credential requests (registrar → library, laboratory & program head → cashier → registrar releases)
    Route::get('/credential-requests', [CredentialRequestController::class, 'index']);
    Route::get('/credential-requests/students', [CredentialRequestController::class, 'searchStudents']);
    Route::post('/credential-requests', [CredentialRequestController::class, 'store']);
    Route::put('/credential-requests/{credentialRequest}', [CredentialRequestController::class, 'update']);
    Route::post('/credential-requests/{credentialRequest}/approve', [CredentialRequestController::class, 'approve']);
    Route::post('/credential-requests/{credentialRequest}/payment', [CredentialRequestController::class, 'processPayment']);
    Route::post('/credential-requests/{credentialRequest}/release', [CredentialRequestController::class, 'release']);
    Route::post('/credential-requests/{credentialRequest}/resend-email', [CredentialRequestController::class, 'resendEmail']);
    Route::post('/credential-requests/{credentialRequest}/revoke', [CredentialRequestController::class, 'revokeApproval']);
    Route::post('/credential-requests/{credentialRequest}/cancel', [CredentialRequestController::class, 'cancel']);

    // Transcript of records: the registrar pulls a student's record, edits it
    // on screen and generates the document. Nothing is stored.
    Route::get('/transcripts/{preEnrolledStudent}', [TranscriptController::class, 'show']);

    // Uniform fabric monitoring (cashier & admin): deliveries in, student purchases out
    Route::get('/uniform-fabric', [UniformFabricController::class, 'index']);
    Route::get('/uniform-fabric/students', [UniformFabricController::class, 'searchStudents']);
    Route::get('/uniform-fabric/purchases', [UniformFabricController::class, 'purchases']);
    Route::get('/uniform-fabric/deliveries', [UniformFabricController::class, 'deliveries']);
    Route::post('/uniform-fabric/purchases', [UniformFabricController::class, 'storePurchase']);
    Route::post('/uniform-fabric/deliveries', [UniformFabricController::class, 'storeDelivery']);
    Route::delete('/uniform-fabric/purchases/{purchase}', [UniformFabricController::class, 'destroyPurchase']);
    Route::delete('/uniform-fabric/deliveries/{delivery}', [UniformFabricController::class, 'destroyDelivery']);

    // School years offered in the enrolment screens (any signed-in user may
    // read the list; only the registrar and admin may change it)
    Route::get('/school-years', [SchoolYearController::class, 'index']);
    Route::post('/school-years', [SchoolYearController::class, 'store']);
    Route::put('/school-years/{schoolYear}', [SchoolYearController::class, 'update']);
    Route::delete('/school-years/{schoolYear}', [SchoolYearController::class, 'destroy']);

    // Student clearance. Every one of these re-checks the signer against the
    // line through ClearanceService — holding a role is never taken on trust
    // from the request.
    Route::prefix('clearance')->group(function () {
        Route::get('/access', [ClearanceController::class, 'access']);
        // The student's own clearance and the code they present when asked
        Route::get('/mine', [ClearanceController::class, 'myClearance']);
        Route::get('/overview', [ClearanceController::class, 'overview']);
        Route::get('/board', [ClearanceController::class, 'board']);
        // Grades held at INC for want of a clearance, for the INC page
        Route::get('/held-grades', [ClearanceController::class, 'heldGrades']);
        Route::get('/clearances/{clearance}', [ClearanceController::class, 'show']);
        Route::post('/scan', [ClearanceController::class, 'scan']);

        Route::post('/items/{item}/approve', [ClearanceController::class, 'approve']);
        Route::post('/bulk-approve', [ClearanceController::class, 'bulkApprove']);
        Route::post('/approve-all', [ClearanceController::class, 'approveAll']);
        Route::post('/generate', [ClearanceController::class, 'generate']);
    });

    // Faculty clearance. Only the views are separate — signing reuses the
    // routes above, because ClearanceService is the single place that decides
    // who may sign a line, whoever the clearance belongs to.
    Route::prefix('faculty-clearance')->group(function () {
        Route::get('/overview', [FacultyClearanceController::class, 'overview']);
        Route::get('/board', [FacultyClearanceController::class, 'board']);
        // The signed-in instructor's own
        Route::get('/mine', [FacultyClearanceController::class, 'mine']);
        Route::post('/generate', [FacultyClearanceController::class, 'generate']);
    });

    // Who signs which clearance line (admin only)
    Route::prefix('clearance-roles')->group(function () {
        Route::get('/', [ClearanceRoleController::class, 'index']);
        Route::get('/assignable-users', [ClearanceRoleController::class, 'assignableUsers']);
        Route::post('/', [ClearanceRoleController::class, 'store']);
        // Creates an account for a signatory who does not have one yet
        Route::post('/signatories', [ClearanceRoleController::class, 'storeSignatory']);
        Route::put('/{clearanceRole}', [ClearanceRoleController::class, 'update']);
        Route::put('/{clearanceRole}/users', [ClearanceRoleController::class, 'syncRole']);
        Route::put('/users/{user}', [ClearanceRoleController::class, 'syncUser']);
    });

    // Student ID monitoring — one card record per issue, counted per school year
    Route::prefix('id-releasing')->group(function () {
        Route::get('/overview', [IdReleasingController::class, 'overview']);
        Route::get('/board', [IdReleasingController::class, 'students']);
        Route::get('/records', [IdReleasingController::class, 'records']);
        Route::get('/students/search', [IdReleasingController::class, 'searchStudents']);
        Route::get('/students/{student}/history', [IdReleasingController::class, 'history']);

        Route::post('/cards/print', [IdReleasingController::class, 'markPrinted']);
        Route::post('/cards/release', [IdReleasingController::class, 'markReleased']);
        Route::post('/cards/replace', [IdReleasingController::class, 'issueReplacement']);
        Route::post('/cards/{issuance}/lost', [IdReleasingController::class, 'reportLost']);
        Route::delete('/cards/{issuance}', [IdReleasingController::class, 'destroyCard']);

        // Slings, holders and card stock: deliveries in, issuances out
        Route::get('/supplies', [IdReleasingController::class, 'supplies']);
        Route::get('/supplies/movements', [IdReleasingController::class, 'movements']);
        Route::post('/supplies/items', [IdReleasingController::class, 'storeItem']);
        Route::put('/supplies/items/{item}', [IdReleasingController::class, 'updateItem']);
        Route::post('/supplies/deliveries', [IdReleasingController::class, 'storeDelivery']);
        Route::post('/supplies/issuances', [IdReleasingController::class, 'storeSupplyIssuance']);
        Route::delete('/supplies/deliveries/{delivery}', [IdReleasingController::class, 'destroyDelivery']);
        Route::delete('/supplies/issuances/{issuance}', [IdReleasingController::class, 'destroySupplyIssuance']);
    });

    // Payment routes
    Route::apiResource('payments', PaymentController::class);
    Route::get('/students/{student_id}/payment', [PaymentController::class, 'getPaymentByStudent']);
    Route::get('/term-payments/by-date', [PaymentController::class, 'getPaymentsByDate']);

    // Section routes
    Route::apiResource('sections', SectionController::class);
    Route::post('sections/{section}/students', [SectionController::class, 'addStudents']);
    Route::delete('sections/{section}/students/{student}', [SectionController::class, 'removeStudent']);
    Route::post('sections/{section}/students/bulk-remove', [SectionController::class, 'removeStudents']);
    Route::post('sections/{section}/toggle-full', [SectionController::class, 'toggleFull']);

    // Enrollment routes
    Route::get('enrollments', [EnrollmentController::class, 'getPreEnrolledStudents']);
    Route::get('enrollments/pending-count', [EnrollmentController::class, 'getPendingEnrollmentCount']);
    Route::put('enrollments/{id}/details', [EnrollmentController::class, 'updateStudentDetails']);
    Route::get('/students/{student}/grades', [EnrollmentController::class, 'getStudentGrades']);
    Route::get('/id-releasing/students', [EnrollmentController::class, 'getStudentsForIdReleasing']);
    Route::put('/id-releasing/students/{id}/status', [EnrollmentController::class, 'updateIdStatus']);
    Route::post('/id-releasing/students/bulk-status', [EnrollmentController::class, 'bulkUpdateIdStatus']);
    Route::post('/id-releasing/reset', [EnrollmentController::class, 'resetIdStatus']);
    Route::post('/grades/update-batch', [EnrollmentController::class, 'updateStudentGrades']);
    Route::post('/enrollments/{student}/credit-subject', [EnrollmentController::class, 'creditSubject']);
    
    // Routes for Continuing Student Enrollment
    Route::get('/enrolled-students/search', [EnrollmentController::class, 'searchEnrolledStudents']);
    Route::post('/enrollments/continuing', [EnrollmentController::class, 'submitContinuingEnrollment']);
    Route::get('/enrollments/continuing/{student}/eligibility', [EnrollmentController::class, 'checkEnrollmentEligibility']);

    // --- NEW: STUDENT-SPECIFIC ROUTE ---
    Route::get('/export-bachelor-students', [EnrollmentController::class, 'getBachelorStudentsForExport']);
    Route::get('/student/enrolled-subjects', [EnrollmentController::class, 'getStudentEnrolledSubjects']);
    Route::get('/student/grades', [EnrollmentController::class, 'getAuthenticatedStudentGrades']);
    Route::get('/student/curriculum', [EnrollmentController::class, 'getStudentCurriculum']);
    Route::get('/student/schedule', [EnrollmentController::class, 'getStudentSchedule']);
    Route::get('/student/eligibility', [EnrollmentController::class, 'getStudentEnrollmentEligibilityStatus']);
    Route::get('/student/subjects-for-term', [EnrollmentController::class, 'getSubjectsForNextTerm']);
    Route::get('/student/payment-history', [PaymentController::class, 'getPaymentForAuthenticatedStudent']);

    // Upload Receipts
    Route::get('upload-receipts', [UploadReceiptController::class, 'index']);

    // Subject Change Request
    Route::get('/students/search', [SubjectChangeRequestController::class, 'searchStudents']);
    Route::get('/students/{studentId}/subject-details', [SubjectChangeRequestController::class, 'getStudentSubjectDetails']);
    
    Route::get('/subject-change-requests', [SubjectChangeRequestController::class, 'index']);
    Route::get('/subjects/{id}/students', [SubjectController::class, 'getEnrolledStudents']); // Get enrolled students for a subject
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
    Route::get('/instructors/{id}/roster', [InstructorController::class, 'getInstructorRoster']);

    // User routes
    Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);

    // Management routes
    Route::post('/management/grading-periods', [ManagementController::class, 'updateGradingPeriods']);

});
    // Management routes
    Route::get('/management/grading-periods', [ManagementController::class, 'getGradingPeriods']);

    Route::get('sections', [SectionController::class, 'index']);

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
    // The acknowledgement the form asks the student to accept. Served rather
    // than kept in the client, so the wording shown, the version recorded and
    // the text quoted back in the confirmation email are the same one.
    Route::get('enrollments/acknowledgement', [EnrollmentController::class, 'acknowledgement']);
    Route::get('enrollments/code/{code}', [EnrollmentController::class, 'checkEnrollmentStatus']);
    Route::get('enrollments/{id}/details', [EnrollmentController::class, 'getPreEnrolledStudentDetails']);
    Route::get('enrollments/{id}', [EnrollmentController::class, 'getPreEnrolledStudentDetails']);
    Route::post('/enrollments/check-email', [EnrollmentController::class, 'checkEmailAvailability']);
    Route::post('/enrollments/check-existence', [EnrollmentController::class, 'checkStudentExistence']);

    // Upload Receipts
    Route::post('upload-receipts', [UploadReceiptController::class, 'store']);
    Route::get('upload-receipts/search-students', [UploadReceiptController::class, 'searchStudents']);

