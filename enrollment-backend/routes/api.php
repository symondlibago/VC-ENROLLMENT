<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\EnrollmentController;

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

