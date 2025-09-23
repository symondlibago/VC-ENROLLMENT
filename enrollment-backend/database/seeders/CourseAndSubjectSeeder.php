<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Program;
use App\Models\Course;
use App\Models\Subject;

class CourseAndSubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Programs
        $shs = Program::where('program_code', 'SHS')->first();
        $diploma = Program::where('program_code', 'Diploma')->first();
        $bachelor = Program::where('program_code', 'Bachelor')->first();

        // Create a Course for SHS and add subjects with schedules
        Course::factory()
            ->has(Subject::factory()->withSchedules()->count(10), 'subjects')
            ->create([
                'program_id' => $shs->id,
                'course_name' => 'Science, Technology, Engineering, and Mathematics',
                'course_code' => 'STEM',
                'years' => 2,
            ]);

        // Create a Course for Diploma and add subjects with schedules
        Course::factory()
            ->has(Subject::factory()->withSchedules()->count(15), 'subjects')
            ->create([
                'program_id' => $diploma->id,
                'course_name' => 'Diploma in Information Technology',
                'course_code' => 'DIT',
                'years' => 3,
            ]);

        // Create a Course for Bachelor and add subjects with schedules
        Course::factory()
            ->has(Subject::factory()->withSchedules()->count(20), 'subjects')
            ->create([
                'program_id' => $bachelor->id,
                'course_name' => 'Bachelor of Science in Computer Science',
                'course_code' => 'BSCS',
                'years' => 4,
            ]);
    }
}
