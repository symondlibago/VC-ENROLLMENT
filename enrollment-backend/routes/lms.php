<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LMS\LmsAuthController;
use App\Http\Controllers\LMS\LmsSubjectController;
use App\Http\Controllers\LMS\LmsModuleController;
use App\Http\Controllers\LMS\LmsAssignmentController;
use App\Http\Controllers\LMS\LmsSubmissionController;
use App\Http\Controllers\LMS\LmsAnnouncementController;
use App\Http\Controllers\LMS\LmsNotificationController;
use App\Http\Controllers\LMS\LmsGradebookController;
use App\Http\Controllers\LMS\LmsDashboardController;
use App\Http\Controllers\LMS\LmsCalendarController;

/*
|--------------------------------------------------------------------------
| LMS API Routes
|--------------------------------------------------------------------------
| Mounted by RouteServiceProvider with prefix "api/lms" and "api" middleware.
| All authenticated routes require a Sanctum token issued by LmsAuthController
| (token ability: 'lms-access').
*/

Route::middleware(['throttle:6,1', \App\Http\Middleware\SecurityHeaders::class])->group(function () {
    Route::post('/login', [LmsAuthController::class, 'login']);
});

Route::middleware([
    'auth:sanctum',
    \Laravel\Sanctum\Http\Middleware\CheckAbilities::class . ':lms-access',
    \App\Http\Middleware\SecurityHeaders::class,
])->group(function () {
    Route::get('/me', [LmsAuthController::class, 'me']);
    Route::post('/logout', [LmsAuthController::class, 'logout']);

    // Subjects
    Route::get('/subjects', [LmsSubjectController::class, 'index']);
    Route::get('/subjects/{id}', [LmsSubjectController::class, 'show']);
    Route::get('/subjects/{id}/sections', [LmsSubjectController::class, 'sections']);
    Route::post('/subjects/{id}/instructors', [LmsSubjectController::class, 'assignInstructor']);
    Route::delete('/subjects/{id}/instructors/{userId}', [LmsSubjectController::class, 'unassignInstructor']);
    Route::get('/instructors/available', [LmsSubjectController::class, 'availableInstructors']);

    // Modules
    Route::get('/subjects/{subjectId}/modules', [LmsModuleController::class, 'indexBySubject']);
    Route::get('/modules/{id}', [LmsModuleController::class, 'show']);
    Route::post('/modules', [LmsModuleController::class, 'store']);
    Route::put('/modules/{id}', [LmsModuleController::class, 'update']);
    Route::delete('/modules/{id}', [LmsModuleController::class, 'destroy']);

    // Module files
    Route::post('/modules/{moduleId}/files', [LmsModuleController::class, 'uploadFile']);
    Route::delete('/files/{fileId}', [LmsModuleController::class, 'deleteFile']);
    Route::get('/files/{fileId}/download', [LmsModuleController::class, 'downloadFile']);

    // Assignments
    Route::get('/modules/{moduleId}/assignments', [LmsAssignmentController::class, 'indexByModule']);
    Route::get('/assignments/{id}', [LmsAssignmentController::class, 'show']);
    Route::post('/assignments', [LmsAssignmentController::class, 'store']);
    Route::put('/assignments/{id}', [LmsAssignmentController::class, 'update']);
    Route::delete('/assignments/{id}', [LmsAssignmentController::class, 'destroy']);

    // Submissions
    Route::post('/assignments/{assignmentId}/submissions', [LmsSubmissionController::class, 'submit']);
    Route::get('/assignments/{assignmentId}/submissions', [LmsSubmissionController::class, 'indexByAssignment']);
    Route::get('/assignments/{assignmentId}/my-submissions', [LmsSubmissionController::class, 'mySubmissions']);
    Route::get('/submissions/{submissionId}/download', [LmsSubmissionController::class, 'download']);
    Route::post('/submissions/{submissionId}/grade', [LmsSubmissionController::class, 'grade']);

    // Announcements
    Route::get('/subjects/{subjectId}/announcements', [LmsAnnouncementController::class, 'indexBySubject']);
    Route::post('/announcements', [LmsAnnouncementController::class, 'store']);
    Route::put('/announcements/{id}', [LmsAnnouncementController::class, 'update']);
    Route::delete('/announcements/{id}', [LmsAnnouncementController::class, 'destroy']);

    // Notifications
    Route::get('/me/notifications', [LmsNotificationController::class, 'index']);
    Route::get('/me/notifications/unread-count', [LmsNotificationController::class, 'unreadCount']);
    Route::post('/me/notifications/{id}/read', [LmsNotificationController::class, 'markRead']);
    Route::post('/me/notifications/read-all', [LmsNotificationController::class, 'markAllRead']);
    Route::delete('/me/notifications/{id}', [LmsNotificationController::class, 'destroy']);

    // Gradebook + roster
    Route::get('/me/gradebook', [LmsGradebookController::class, 'myGradebook']);
    Route::get('/assignments/{assignmentId}/roster', [LmsGradebookController::class, 'roster']);

    // Dashboard
    Route::get('/me/dashboard', [LmsDashboardController::class, 'index']);

    // Calendar (assignment deadlines, role-scoped)
    Route::get('/me/calendar', [LmsCalendarController::class, 'index']);
});
