<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Program>
 */
class ProgramFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'program_name' => $this->faker->unique()->word() . ' Program',
            'program_code' => $this->faker->randomElement(['SHS', 'Diploma', 'Bachelor']),
            'years' => $this->faker->numberBetween(2, 4),
        ];
    }
}