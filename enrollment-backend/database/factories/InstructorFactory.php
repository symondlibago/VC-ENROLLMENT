<?php

namespace Database\Factories;

use App\Models\Instructor;
use Illuminate\Database\Eloquent\Factories\Factory;

class InstructorFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Instructor::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'title' => $this->faker->jobTitle(),
            'department' => $this->faker->randomElement(['IT Department', 'Business Department', 'Science Department']),
            'email' => $this->faker->unique()->safeEmail(),
            'status' => 'Active',
            'is_featured' => $this->faker->boolean(20), 
        ];
    }
}