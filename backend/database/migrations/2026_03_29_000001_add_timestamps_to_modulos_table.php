<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            if (!Schema::hasColumn('modulos', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }
            if (!Schema::hasColumn('modulos', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('modulos', function (Blueprint $table) {
            $table->dropColumn(array_filter(['created_at', 'updated_at'], function ($col) {
                return Schema::hasColumn('modulos', $col);
            }));
        });
    }
};
