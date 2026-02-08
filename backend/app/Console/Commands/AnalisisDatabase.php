<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AnalisisDatabase extends Command
{
    protected $signature = 'db:analisis';
    protected $description = 'Analizar la estructura de la base de datos';

    public function handle()
    {
        $this->info('=== ANÁLISIS DE ESTRUCTURA DE BASES DE DATOS ===');
        
        // 1. Estructura de tabla PREGUNTAS
        $this->line('');
        $this->info('1. TABLA: preguntas');
        $this->info('===================');
        $preguntas = DB::select("DESCRIBE preguntas");
        foreach ($preguntas as $col) {
            $this->line(sprintf("%-20s %-20s %-10s", $col->Field, $col->Type, $col->Null));
        }
        
        // 2. Estructura de tabla CATEGORIAS
        $this->line('');
        $this->info('2. TABLA: categorias (MÓDULOS PADRES)');
        $this->info('====================================');
        $categorias = DB::select("DESCRIBE categorias");
        foreach ($categorias as $col) {
            $this->line(sprintf("%-20s %-20s %-10s", $col->Field, $col->Type, $col->Null));
        }
        
        // 3. Estructura de tabla MODULOS
        $this->line('');
        $this->info('3. TABLA: modulos (TABLA JERÁRQUICA)');
        $this->info('====================================');
        $modulos = DB::select("DESCRIBE modulos");
        foreach ($modulos as $col) {
            $this->line(sprintf("%-20s %-20s %-10s", $col->Field, $col->Type, $col->Null));
        }
        
        // 4. Datos de ejemplo
        $this->line('');
        $this->info('4. DATOS DE EJEMPLO:');
        $this->info('==================');
        
        $this->line('');
        $this->comment('Categorias (Módulos Padres):');
        $cats = DB::table('categorias')->limit(5)->get();
        foreach ($cats as $cat) {
            $this->line("  ID: {$cat->id}, Nombre: {$cat->nombre}");
        }
        
        $this->line('');
        $this->comment('Modulos (Pueden ser padres o submódulos):');
        $mods = DB::table('modulos')->select('id', 'nombre', 'id_padre')->limit(5)->get();
        foreach ($mods as $mod) {
            $padre_text = $mod->id_padre ? "padre: {$mod->id_padre}" : "PADRE (raíz)";
            $this->line("  ID: {$mod->id}, Nombre: {$mod->nombre}, {$padre_text}");
        }
        
        $this->line('');
        $this->comment('Preguntas:');
        $preg = DB::table('preguntas')->limit(3)->get();
        foreach ($preg as $p) {
            $this->line("  ID: {$p->id}");
            $this->line("    Pregunta: " . substr($p->Pregunta, 0, 60) . "...");
            $this->line("    Idmodulo: {$p->Idmodulo}");
            $this->line("    Modulo: {$p->Modulo}");
        }
        
        // 5. Resumen
        $this->line('');
        $this->info('5. RESUMEN DE INTERCONEXIÓN:');
        $this->info('============================');
        $this->line('Estructura jerárquica de 3 niveles:');
        $this->line('');
        $this->line('CATEGORIAS (Tabla Base)');
        $this->line('    ├── id (PK)');
        $this->line('    ├── nombre');
        $this->line('    └── descripcion');
        $this->line('');
        $this->line('MODULOS (Tabla Jerárquica)');
        $this->line('    ├── id (PK)');
        $this->line('    ├── nombre');
        $this->line('    ├── id_categoria (FK → CATEGORIAS.id)');
        $this->line('    └── id_padre (FK → MODULOS.id, auto-referencia para submódulos)');
        $this->line('');
        $this->line('PREGUNTAS (Datos)');
        $this->line('    ├── id (PK)');
        $this->line('    ├── Pregunta');
        $this->line('    ├── Respuesta');
        $this->line('    ├── Idmodulo (FK → MODULOS.id o NULL)');
        $this->line('    ├── Modulo (Texto - Nombre del módulo)');
        $this->line('    └── Submodulo (Texto - Nombre del submódulo)');
        $this->line('');
        $this->line('Relaciones:');
        $this->line('  • PREGUNTAS.Idmodulo → MODULOS.id (N:1)');
        $this->line('  • MODULOS.id_categoria → CATEGORIAS.id (N:1)');
        $this->line('  • MODULOS.id_padre → MODULOS.id (Auto-referencia para jerarquía)');
    }
}
