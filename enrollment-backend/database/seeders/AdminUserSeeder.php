<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Existing admin user
        $adminUser = User::where('email', 'libago.symond1@gmail.com')->first();
        
        if (!$adminUser) {
            User::create([
                'name' => 'Admin User',
                'email' => 'libago.symond1@gmail.com',
                'password' => Hash::make('password'),
                'role' => 'Admin'
            ]);
        }
    
        // New Cashier account
        User::firstOrCreate(
            ['email' => 'cashier@example.com'],
            [
                'name' => 'Cashier User',
                'password' => Hash::make('cashier123'),
                'role' => 'Cashier'
            ]
        );
    
        // New Program Head account
        User::firstOrCreate(
            ['email' => 'programhead@example.com'],
            [
                'name' => 'Program Head User',
                'password' => Hash::make('head123'),
                'role' => 'Program Head'
            ]
        );
    
        // New Registrar account
        User::firstOrCreate(
            ['email' => 'registrar@example.com'],
            [
                'name' => 'Registrar User',
                'password' => Hash::make('registrar123'),
                'role' => 'Registrar'
            ]
        );
    }
}