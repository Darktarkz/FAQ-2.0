<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modulo_formulario_config', function (Blueprint $table) {
            $table->id();
            $table->integer('modulo_id')->unique();
            
            // Campos opcionales que se pueden mostrar/ocultar
            $table->boolean('mostrar_tipo_identificacion')->default(true);
            $table->boolean('mostrar_cedula')->default(true);
            $table->boolean('mostrar_telefono')->default(true);
            $table->boolean('mostrar_numero_contrato')->default(false);
            $table->boolean('mostrar_screenshot')->default(true);
            
            // Campos siempre visibles: nombre_completo, correo, descripcion
            
            $table->timestamps();
            
            // Foreign key
            $table->foreign('modulo_id')->references('id')->on('modulos')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modulo_formulario_config');
    }
};
