<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SolicitudAcceso extends Model
{
    protected $table = 'solicitudes_acceso';

    protected $fillable = [
        'nombre_completo',
        'tipo_documento',
        'numero_documento',
        'usuario_red',
        'correo',
        'dependencia_id',
        'cargo_tipo',
        'cargo_nombre',
        'plataformas',
        'estado',
    ];

    protected $casts = [
        'plataformas' => 'array',
    ];

    public function dependencia()
    {
        return $this->belongsTo(Dependencia::class);
    }

    public function scopePorEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }
}
