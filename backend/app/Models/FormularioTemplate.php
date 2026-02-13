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
        // Convertir a entero para asegurar el tipo correcto
        $moduloId = (int) $moduloId;
        
        // Buscar por JSON o por búsqueda manual si JSON falla
        $template = self::where('activo', true)
            ->where(function($query) use ($moduloId) {
                $query->whereJsonContains('modulos_asignados', $moduloId)
                      ->orWhereJsonContains('modulos_asignados', (string) $moduloId);
            })
            ->with('campos')
            ->first();
        
        // Si no se encuentra, buscar manualmente en todos los templates
        if (!$template) {
            $templates = self::where('activo', true)->with('campos')->get();
            foreach ($templates as $t) {
                if (is_array($t->modulos_asignados) && in_array($moduloId, $t->modulos_asignados)) {
                    $template = $t;
                    break;
                }
            }
        }
        
        return $template;
    }
}
