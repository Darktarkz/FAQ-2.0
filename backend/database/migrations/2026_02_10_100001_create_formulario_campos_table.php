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
        Schema::create('formulario_campos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('formulario_template_id')->constrained('formulario_templates')->onDelete('cascade');
            $table->string('nombre_campo'); // nombre técnico (sin espacios)
            $table->string('etiqueta'); // label visible
            $table->enum('tipo', ['text', 'email', 'tel', 'number', 'date', 'select', 'textarea', 'file', 'checkbox', 'radio']);
            $table->string('placeholder')->nullable();
            $table->text('descripcion_ayuda')->nullable(); // help text
            $table->boolean('requerido')->default(false);
            $table->json('opciones')->nullable(); // Para select, radio, checkbox
            $table->string('validacion')->nullable(); // Regex o reglas de validación
            $table->integer('orden')->default(0);
            $table->integer('tamano_columna')->default(12); // 1-12 para grid layout
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('formulario_campos');
    }
};
