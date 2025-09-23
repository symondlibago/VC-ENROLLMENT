<?php

namespace Database\Factories;

use App\Models\EnrollmentCode;
use Illuminate\Database\Eloquent\Factories\Factory;


class EnrollmentCodeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => EnrollmentCode::generateUniqueCode(),
            'is_used' => false,
        ];
    }
}
