<?php

namespace Database\Seeders;

use App\Models\EnrollmentCode;
use App\Models\PreEnrolledStudent;
use App\Models\Subject;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StudentSubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = PreEnrolledStudent::all();

        foreach ($students as $student) {
            // Find subjects that match the student's year and semester
            $subjects = Subject::where('course_id', $student->course_id)
                               ->where('year', $student->year)
                               ->where('semester', $student->semester)
                               ->get();

            // Attach the subjects to the student in the pivot table
            if ($subjects->isNotEmpty()) {
                $student->subjects()->attach($subjects->pluck('id'));
            }

            // Create a unique enrollment code for each student
            EnrollmentCode::factory()->create([
                'pre_enrolled_student_id' => $student->id,
            ]);
        }
    }
}