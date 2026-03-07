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
        'activo',
    ];

    protected $casts = [
        'modulos_asignados' => 'array',
        'activo' => 'boolean',
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
}
