<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Subject; // Import the Subject model
use Illuminate\Database\Eloquent\Factories\Factory;


class PreEnrolledStudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subject = Subject::inRandomOrder()->first();
        if (!$subject) {
            $course = Course::factory()->create();
            $year = '1st Year';
            $semester = '1st Semester';
        } else {
            $course = $subject->course;
            $year = $subject->year;
            $semester = $subject->semester;
        }

        return [
            'course_id' => $course->id, // Assign the guaranteed course_id
            'last_name' => $this->faker->lastName,
            'first_name' => $this->faker->firstName,
            'middle_name' => $this->faker->lastName,
            'gender' => $this->faker->randomElement(['Male', 'Female']),
            'birth_date' => $this->faker->date(),
            'birth_place' => $this->faker->city,
            'nationality' => 'Filipino',
            'civil_status' => $this->faker->randomElement(['Single', 'Married']),
            'religion' => 'Christianity',
            'address' => $this->faker->address,
            'contact_number' => $this->faker->phoneNumber,
            'email_address' => $this->faker->unique()->safeEmail,
            'father_name' => $this->faker->name('male'),
            'mother_name' => $this->faker->name('female'),
            'parents_address' => $this->faker->address,
            'emergency_contact_name' => $this->faker->name,
            'emergency_contact_number' => $this->faker->phoneNumber,
            'emergency_contact_address' => $this->faker->address,
            'senior_high_school' => $this->faker->company . ' Senior High',
            'senior_high_date_completed' => '2022',
            'semester' => $semester, // Assign the guaranteed semester
            'school_year' => '2025-2026',
            'year' => $year, // Assign the guaranteed year
            'enrollment_type' => 'New Student',
            'enrollment_status' => 'enrolled',
        ];
    }
}