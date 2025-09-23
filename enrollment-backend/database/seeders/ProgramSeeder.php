<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Program;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Program::firstOrCreate(
            ['program_name' => 'Senior High School'],
            ['program_code' => 'SHS', 'years' => 2]
        );

        Program::firstOrCreate(
            ['program_name' => 'Diploma Programs'],
            ['program_code' => 'Diploma', 'years' => 3]
        );

        Program::firstOrCreate(
            ['program_name' => 'Bachelor\'s Degree'],
            ['program_code' => 'Bachelor', 'years' => 4]
        );
    }
}