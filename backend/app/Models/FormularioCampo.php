<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FormularioCampo extends Model
{
    use HasFactory;

    protected $fillable = [
        'formulario_template_id',
        'nombre_campo',
        'etiqueta',
        'tipo',
        'placeholder',
        'descripcion_ayuda',
        'requerido',
        'opciones',
        'validacion',
        'orden',
        'tamano_columna',
    ];

    protected $casts = [
        'requerido' => 'boolean',
        'opciones' => 'array',
        'orden' => 'integer',
        'tamano_columna' => 'integer',
    ];

    /**
     * Relación con el template del formulario
     */
    public function template()
    {
        return $this->belongsTo(FormularioTemplate::class, 'formulario_template_id');
    }
}
