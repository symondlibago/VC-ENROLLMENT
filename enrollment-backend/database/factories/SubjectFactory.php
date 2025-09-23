<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Schedule;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subject>
 */
class SubjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'subject_code' => $this->faker->unique()->bothify('??-###'),
            'descriptive_title' => $this->faker->sentence(4),
            'lec_hrs' => $this->faker->numberBetween(1, 3),
            'lab_hrs' => $this->faker->numberBetween(0, 2),
            'total_units' => $this->faker->numberBetween(2, 4),
            'year' => $this->faker->randomElement(['1st Year', '2nd Year', '3rd Year', '4th Year']),
            'semester' => $this->faker->randomElement(['1st Semester', '2nd Semester']),
        ];
    }

    /**
     * Configure the model factory.
     *
     * @return $this
     */
    public function configure()
    {
        return $this->afterCreating(function (Subject $subject) {
            // This will run for every subject created
        });
    }

    /**
     * Indicate that the subject should have schedules.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function withSchedules()
    {
        return $this->has(Schedule::factory()->count($this->faker->numberBetween(1, 2)), 'schedules');
    }
}
