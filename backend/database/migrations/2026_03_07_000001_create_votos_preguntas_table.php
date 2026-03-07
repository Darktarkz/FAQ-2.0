<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('votos_preguntas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pregunta_id');
            $table->enum('voto', ['util', 'no_util']);
            $table->string('session_id', 64)->nullable(); // para evitar votos duplicados
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index(['pregunta_id', 'voto']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votos_preguntas');
    }
};
