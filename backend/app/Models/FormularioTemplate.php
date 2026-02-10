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
        return self::where('activo', true)
            ->whereJsonContains('modulos_asignados', $moduloId)
            ->with('campos')
            ->first();
    }
}
