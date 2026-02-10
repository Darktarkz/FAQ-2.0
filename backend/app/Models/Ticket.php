<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'numero_ticket',
        'modulo_id',
        'nombre_completo',
        'tipo_identificacion',
        'cedula',
        'correo',
        'telefono',
        'numero_contrato',
        'descripcion',
        'screenshot_path',
        'estado',
        'prioridad',
    ];

    /**
     * Relación con el módulo
     */
    public function modulo()
    {
        return $this->belongsTo(Modulo::class);
    }

    /**
     * Generar número de ticket único
     */
    public static function generarNumeroTicket(): string
    {
        do {
            $numero = 'TICKET-' . date('Ymd') . '-' . rand(1000, 9999);
        } while (self::where('numero_ticket', $numero)->exists());

        return $numero;
    }

    /**
     * Scope para filtrar por módulo
     */
    public function scopePorModulo($query, $moduloId)
    {
        return $query->where('modulo_id', $moduloId);
    }

    /**
     * Scope para filtrar por estado
     */
    public function scopePorEstado($query, $estado)
    {
        return $query->where('estado', $estado);
    }
}
