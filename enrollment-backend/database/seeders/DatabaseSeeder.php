<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application\'s database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            ProgramSeeder::class,
            CourseAndSubjectSeeder::class,
            StudentSeeder::class,
            StudentSubjectSeeder::class,
            InstructorSeeder::class,
        ]);
    }
}

