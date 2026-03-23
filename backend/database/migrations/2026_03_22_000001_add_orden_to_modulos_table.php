<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->unsignedInteger('orden')->default(0)->after('icono');
        });

        // Inicializar el orden según el id actual
        DB::statement('UPDATE modulos SET orden = id WHERE orden = 0');
    }

    public function down(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->dropColumn('orden');
        });
    }
};
