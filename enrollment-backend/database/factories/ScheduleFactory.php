<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Schedule>
 */

 use App\Models\Instructor;
class ScheduleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Find an existing instructor, OR create a new one if the table is empty.
        $instructor = Instructor::inRandomOrder()->first() ?? Instructor::factory()->create();

        return [
            'day' => $this->faker->randomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
            'time' => $this->faker->randomElement(['8:00 AM - 9:00 AM', '9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '1:00 PM - 2:00 PM']),
            'room_no' => 'Room ' . $this->faker->numberBetween(100, 500),
            'instructor_id' => $instructor->id, // Use the instructor's ID
        ];
    }
}
