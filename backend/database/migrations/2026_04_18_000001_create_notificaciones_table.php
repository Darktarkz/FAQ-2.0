<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('tipo', ['voto_util', 'voto_no_util']);
            $table->unsignedInteger('pregunta_id');
            $table->integer('modulo_id')->nullable();
            $table->string('mensaje');
            $table->boolean('leida')->default(false);
            $table->timestamps();

            $table->foreign('modulo_id')->references('id')->on('modulos')->onDelete('set null');
            $table->index(['user_id', 'leida']);
            $table->index('pregunta_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
