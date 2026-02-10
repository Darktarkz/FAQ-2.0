<?php

namespace App\Http\Controllers;

use App\Models\ModuloFormularioConfig;
use App\Models\Modulo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ModuloFormularioConfigController extends Controller
{
    /**
     * Obtener configuración de formulario por módulo_id
     */
    public function getPorModulo($moduloId)
    {
        try {
            $config = ModuloFormularioConfig::porModulo($moduloId);
            
            return response()->json([
                'success' => true,
                'config' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener configuración: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Listar todas las configuraciones con información del módulo
     */
    public function index()
    {
        try {
            $modulos = Modulo::all();
            $configuraciones = [];

            foreach ($modulos as $modulo) {
                $config = ModuloFormularioConfig::where('modulo_id', $modulo->id)->first();
                
                $configuraciones[] = [
                    'modulo_id' => $modulo->id,
                    'modulo_nombre' => $modulo->nombre,
                    'config' => $config ? $config->toArray() : ModuloFormularioConfig::porModulo($modulo->id)
                ];
            }

            return response()->json([
                'success' => true,
                'configuraciones' => $configuraciones
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al listar configuraciones: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Guardar o actualizar configuración
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'modulo_id' => 'required|integer|exists:modulos,id',
            'mostrar_tipo_identificacion' => 'boolean',
            'mostrar_cedula' => 'boolean',
            'mostrar_telefono' => 'boolean',
            'mostrar_numero_contrato' => 'boolean',
            'mostrar_screenshot' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $config = ModuloFormularioConfig::updateOrCreate(
                ['modulo_id' => $request->modulo_id],
                $request->only([
                    'mostrar_tipo_identificacion',
                    'mostrar_cedula',
                    'mostrar_telefono',
                    'mostrar_numero_contrato',
                    'mostrar_screenshot'
                ])
            );

            return response()->json([
                'success' => true,
                'message' => 'Configuración guardada exitosamente',
                'config' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar configuración: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restablecer configuración a valores por defecto
     */
    public function reset($moduloId)
    {
        try {
            ModuloFormularioConfig::where('modulo_id', $moduloId)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Configuración restablecida a valores por defecto',
                'config' => ModuloFormularioConfig::porModulo($moduloId)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al restablecer configuración: ' . $e->getMessage()
            ], 500);
        }
    }
}
