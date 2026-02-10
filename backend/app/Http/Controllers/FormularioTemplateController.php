<?php

namespace App\Http\Controllers;

use App\Models\FormularioTemplate;
use App\Models\FormularioCampo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class FormularioTemplateController extends Controller
{
    /**
     * Listar todos los formularios (solo admin)
     */
    public function index(): JsonResponse
    {
        $formularios = FormularioTemplate::with('campos')->get();
        
        return response()->json([
            'success' => true,
            'formularios' => $formularios
        ]);
    }

    /**
     * Ver un formulario específico con sus campos
     */
    public function show($id): JsonResponse
    {
        $formulario = FormularioTemplate::with('campos')->find($id);

        if (!$formulario) {
            return response()->json([
                'success' => false,
                'message' => 'Formulario no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'formulario' => $formulario
        ]);
    }

    /**
     * Obtener formulario asignado a un módulo específico (público)
     */
    public function porModulo($moduloId): JsonResponse
    {
        $formulario = FormularioTemplate::porModulo($moduloId);

        if (!$formulario) {
            return response()->json([
                'success' => false,
                'message' => 'No hay formulario asignado a este módulo',
                'formulario' => null
            ]);
        }

        return response()->json([
            'success' => true,
            'formulario' => $formulario
        ]);
    }

    /**
     * Crear un nuevo formulario con sus campos
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'modulos_asignados' => 'nullable|array',
            'modulos_asignados.*' => 'integer',
            'activo' => 'boolean',
            'campos' => 'required|array|min:1',
            'campos.*.nombre_campo' => 'required|string|max:100',
            'campos.*.etiqueta' => 'required|string|max:255',
            'campos.*.tipo' => 'required|in:text,email,tel,number,date,select,textarea,file,checkbox,radio',
            'campos.*.requerido' => 'boolean',
            'campos.*.orden' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Crear el template
            $formulario = FormularioTemplate::create([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'modulos_asignados' => $request->modulos_asignados ?? [],
                'activo' => $request->activo ?? true,
            ]);

            // Crear los campos
            foreach ($request->campos as $campo) {
                FormularioCampo::create([
                    'formulario_template_id' => $formulario->id,
                    'nombre_campo' => $campo['nombre_campo'],
                    'etiqueta' => $campo['etiqueta'],
                    'tipo' => $campo['tipo'],
                    'placeholder' => $campo['placeholder'] ?? null,
                    'descripcion_ayuda' => $campo['descripcion_ayuda'] ?? null,
                    'requerido' => $campo['requerido'] ?? false,
                    'opciones' => $campo['opciones'] ?? null,
                    'validacion' => $campo['validacion'] ?? null,
                    'orden' => $campo['orden'] ?? 0,
                    'tamano_columna' => $campo['tamano_columna'] ?? 12,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Formulario creado exitosamente',
                'formulario' => $formulario->load('campos')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el formulario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un formulario existente
     */
    public function update(Request $request, $id): JsonResponse
    {
        $formulario = FormularioTemplate::find($id);

        if (!$formulario) {
            return response()->json([
                'success' => false,
                'message' => 'Formulario no encontrado'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'string|max:255',
            'descripcion' => 'nullable|string',
            'modulos_asignados' => 'nullable|array',
            'activo' => 'boolean',
            'campos' => 'array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Actualizar el template
            $formulario->update($request->only([
                'nombre',
                'descripcion',
                'modulos_asignados',
                'activo'
            ]));

            // Si se envían campos, actualizar
            if ($request->has('campos')) {
                // Eliminar campos existentes
                $formulario->campos()->delete();

                // Crear nuevos campos
                foreach ($request->campos as $campo) {
                    FormularioCampo::create([
                        'formulario_template_id' => $formulario->id,
                        'nombre_campo' => $campo['nombre_campo'],
                        'etiqueta' => $campo['etiqueta'],
                        'tipo' => $campo['tipo'],
                        'placeholder' => $campo['placeholder'] ?? null,
                        'descripcion_ayuda' => $campo['descripcion_ayuda'] ?? null,
                        'requerido' => $campo['requerido'] ?? false,
                        'opciones' => $campo['opciones'] ?? null,
                        'validacion' => $campo['validacion'] ?? null,
                        'orden' => $campo['orden'] ?? 0,
                        'tamano_columna' => $campo['tamano_columna'] ?? 12,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Formulario actualizado exitosamente',
                'formulario' => $formulario->load('campos')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el formulario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un formulario
     */
    public function destroy($id): JsonResponse
    {
        $formulario = FormularioTemplate::find($id);

        if (!$formulario) {
            return response()->json([
                'success' => false,
                'message' => 'Formulario no encontrado'
            ], 404);
        }

        try {
            $formulario->delete();

            return response()->json([
                'success' => true,
                'message' => 'Formulario eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el formulario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicar un formulario existente
     */
    public function duplicate($id): JsonResponse
    {
        $formularioOriginal = FormularioTemplate::with('campos')->find($id);

        if (!$formularioOriginal) {
            return response()->json([
                'success' => false,
                'message' => 'Formulario no encontrado'
            ], 404);
        }

        try {
            DB::beginTransaction();

            // Crear copia del template
            $formularioNuevo = FormularioTemplate::create([
                'nombre' => $formularioOriginal->nombre . ' (Copia)',
                'descripcion' => $formularioOriginal->descripcion,
                'modulos_asignados' => [],
                'activo' => false,
            ]);

            // Copiar campos
            foreach ($formularioOriginal->campos as $campo) {
                FormularioCampo::create([
                    'formulario_template_id' => $formularioNuevo->id,
                    'nombre_campo' => $campo->nombre_campo,
                    'etiqueta' => $campo->etiqueta,
                    'tipo' => $campo->tipo,
                    'placeholder' => $campo->placeholder,
                    'descripcion_ayuda' => $campo->descripcion_ayuda,
                    'requerido' => $campo->requerido,
                    'opciones' => $campo->opciones,
                    'validacion' => $campo->validacion,
                    'orden' => $campo->orden,
                    'tamano_columna' => $campo->tamano_columna,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Formulario duplicado exitosamente',
                'formulario' => $formularioNuevo->load('campos')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al duplicar el formulario: ' . $e->getMessage()
            ], 500);
        }
    }
}
