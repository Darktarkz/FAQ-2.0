<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preguntas', function (Blueprint $table) {
            $table->bigIncrements('ID');
            $table->unsignedBigInteger('Idmodulo')->nullable();
            $table->integer('orden')->default(0);
            $table->string('Aplicativo')->nullable();
            $table->text('Pregunta');
            $table->text('Respuesta');
            $table->string('Modulo')->nullable();
            $table->string('Submodulo')->nullable();

            $table->foreign('Idmodulo')->references('id')->on('modulos')->onDelete('set null');
            $table->index('orden');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preguntas');
    }
};
