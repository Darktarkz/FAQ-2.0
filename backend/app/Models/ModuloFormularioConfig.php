<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModuloFormularioConfig extends Model
{
    use HasFactory;

    protected $table = 'modulo_formulario_config';

    protected $fillable = [
        'modulo_id',
        'mostrar_tipo_identificacion',
        'mostrar_cedula',
        'mostrar_telefono',
        'mostrar_numero_contrato',
        'mostrar_screenshot'
    ];

    protected $casts = [
        'mostrar_tipo_identificacion' => 'boolean',
        'mostrar_cedula' => 'boolean',
        'mostrar_telefono' => 'boolean',
        'mostrar_numero_contrato' => 'boolean',
        'mostrar_screenshot' => 'boolean'
    ];

    public function modulo()
    {
        return $this->belongsTo(Modulo::class, 'modulo_id');
    }

    /**
     * Obtener configuración por módulo_id, retorna default si no existe
     */
    public static function porModulo(int $moduloId): array
    {
        $config = self::where('modulo_id', $moduloId)->first();

        if (!$config) {
            // Retornar configuración por defecto
            return [
                'modulo_id' => $moduloId,
                'mostrar_tipo_identificacion' => true,
                'mostrar_cedula' => true,
                'mostrar_telefono' => true,
                'mostrar_numero_contrato' => false,
                'mostrar_screenshot' => true
            ];
        }

        return $config->toArray();
    }
}
