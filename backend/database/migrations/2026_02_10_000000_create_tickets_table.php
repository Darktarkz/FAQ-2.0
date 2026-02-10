<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('numero_ticket')->unique();
            $table->integer('modulo_id');
            $table->string('nombre_completo');
            $table->string('tipo_identificacion')->nullable();
            $table->string('cedula')->nullable();
            $table->string('correo');
            $table->string('telefono')->nullable();
            $table->string('numero_contrato')->nullable();
            $table->text('descripcion');
            $table->string('screenshot_path')->nullable();
            $table->enum('estado', ['pendiente', 'en_proceso', 'resuelto', 'cerrado'])->default('pendiente');
            $table->enum('prioridad', ['baja', 'media', 'alta'])->default('media');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
