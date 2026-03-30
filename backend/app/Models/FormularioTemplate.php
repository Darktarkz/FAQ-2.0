<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormularioTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'descripcion',
        'modulos_asignados',
        'pregunta_id',
        'activo',
    ];

    protected $casts = [
        'modulos_asignados' => 'array',
        'activo' => 'boolean',
        'pregunta_id' => 'integer',
    ];

    /**
     * Relación con los campos del formulario
     */
    public function campos()
    {
        return $this->hasMany(FormularioCampo::class)->orderBy('orden');
    }

    /**
     * Obtener formulario asignado a un módulo específico
     */
    public static function porModulo($moduloId)
    {
        $moduloId = (int) $moduloId;

        // Búsqueda PHP-side para evitar incompatibilidades de JSON_CONTAINS entre versiones de MySQL/MariaDB
        foreach (self::where('activo', true)->with('campos')->get() as $template) {
            // Soporta tanto array (cast aplicado) como string JSON crudo (cast no aplicado)
            $asignados = $template->modulos_asignados;
            if (!is_array($asignados)) {
                $asignados = json_decode($asignados ?: '[]', true) ?? [];
            }
            foreach ($asignados as $id) {
                if ((int) $id === $moduloId) {
                    return $template;
                }
            }
        }

        return null;
    }

    /**
     * Obtener formulario con herencia jerárquica.
     * Si el módulo no tiene template propio, sube por idpadre hasta encontrar uno.
     * Retorna ['template' => FormularioTemplate|null, 'origen_modulo_id' => int|null]
     */
    public static function porModuloConHerencia(int $moduloId): array
    {
        // Cargar todos los templates activos una sola vez
        $templates = self::where('activo', true)->with('campos')->get();

        // Construir mapa moduloId => template para búsqueda O(1)
        $templateByModulo = [];
        foreach ($templates as $template) {
            $asignados = $template->modulos_asignados;
            if (!is_array($asignados)) {
                $asignados = json_decode($asignados ?: '[]', true) ?? [];
            }
            foreach ($asignados as $id) {
                $templateByModulo[(int) $id] = $template;
            }
        }

        // Subir por el árbol de ancestros hasta encontrar un template
        $current = $moduloId;
        while ($current !== null) {
            if (isset($templateByModulo[$current])) {
                return [
                    'template'         => $templateByModulo[$current],
                    'origen_modulo_id' => $current,
                ];
            }
            $modulo = \App\Models\Modulo::find($current);
            if (!$modulo || !$modulo->idpadre) {
                break;
            }
            $current = (int) $modulo->idpadre;
        }

        return ['template' => null, 'origen_modulo_id' => null];
    }

    /**
     * Obtener formulario asignado a una pregunta específica
     */
    public static function porPregunta($preguntaId)
    {
        return self::where('activo', true)
            ->where('pregunta_id', (int) $preguntaId)
            ->first();
    }
}
