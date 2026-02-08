<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Crear usuario administrador por defecto
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@faq.com'],
            [
                'name' => 'Administrador',
                'email' => 'admin@faq.com',
                'password' => Hash::make('admin123'),
                'is_admin' => true,
            ]
        );

        $this->command->info('Usuario admin creado:');
        $this->command->info('Email: admin@faq.com');
        $this->command->info('Password: admin123');
    }
}
