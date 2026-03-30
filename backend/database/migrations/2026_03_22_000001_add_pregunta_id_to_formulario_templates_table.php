<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('formulario_templates', function (Blueprint $table) {
            // Nullable: solo preguntas específicas tendrán valor aquí
            $table->unsignedBigInteger('pregunta_id')->nullable()->after('id');
            // No FK constraint porque preguntas.ID puede ser de tabla legacy sin PK estándar
        });
    }

    public function down(): void
    {
        Schema::table('formulario_templates', function (Blueprint $table) {
            $table->dropColumn('pregunta_id');
        });
    }
};
