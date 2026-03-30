<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_acceso', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_completo');
            $table->enum('tipo_documento', ['CC', 'CE', 'TI', 'Pasaporte', 'NIT']);
            $table->string('numero_documento');
            $table->string('usuario_red');
            $table->string('correo');
            $table->foreignId('dependencia_id')->constrained('dependencias')->restrictOnDelete();
            $table->enum('cargo_tipo', ['contratista', 'funcionario']);
            $table->string('cargo_nombre')->nullable();
            $table->json('plataformas'); // JSON con datos de cada plataforma seleccionada
            $table->enum('estado', ['pendiente', 'en_proceso', 'resuelto'])->default('pendiente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_acceso');
    }
};
