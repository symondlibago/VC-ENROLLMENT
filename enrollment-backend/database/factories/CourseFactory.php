<?php

namespace Database\Factories;

use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'program_id' => Program::factory(),
            'course_code' => $this->faker->unique()->lexify('???-###'),
            'course_name' => $this->faker->unique()->sentence(3),
            'course_specialization' => $this->faker->sentence(2),
            'description' => $this->faker->paragraph(),
            'years' => $this->faker->numberBetween(2, 4),
        ];
    }
}