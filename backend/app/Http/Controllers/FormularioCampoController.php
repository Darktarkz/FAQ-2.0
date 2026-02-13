<?php

namespace App\Http\Controllers;

use App\Models\FormularioCampo;
use App\Models\FormularioTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class FormularioCampoController extends Controller
{
    /**
     * Obtener todos los campos personalizados de un módulo
     */
    public function getPorModulo($moduloId)
    {
        try {
            \Log::info("Buscando campos para módulo: {$moduloId}");
            
            $template = FormularioTemplate::porModulo($moduloId);
            
            if (!$template) {
                \Log::info("No se encontró template para módulo: {$moduloId}");
                return response()->json([
                    'success' => true,
                    'campos' => []
                ]);
            }

            $campos = $template->campos;
            \Log::info("Template encontrado con {$campos->count()} campos para módulo: {$moduloId}");

            return response()->json([
                'success' => true,
                'template_id' => $template->id,
                'campos' => $campos
            ]);
        } catch (\Exception $e) {
            \Log::error("Error al obtener campos para módulo {$moduloId}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener campos: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo campo personalizado
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'modulo_id' => 'required|integer|exists:modulos,id',
            'nombre_campo' => 'required|string|max:255',
            'etiqueta' => 'required|string|max:255',
            'tipo' => 'required|in:text,email,tel,number,date,select,textarea,file,checkbox,radio',
            'placeholder' => 'nullable|string',
            'descripcion_ayuda' => 'nullable|string',
            'requerido' => 'boolean',
            'opciones' => 'nullable|array',
            'validacion' => 'nullable|string',
            'orden' => 'nullable|integer',
            'tamano_columna' => 'nullable|integer|min:1|max:12',
            'visible' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Buscar o crear template para este módulo
            $template = FormularioTemplate::porModulo($request->modulo_id);
            
            if (!$template) {
                \Log::info("Creando nuevo template para módulo: {$request->modulo_id}");
                $template = FormularioTemplate::create([
                    'nombre' => 'Formulario Módulo ' . $request->modulo_id,
                    'descripcion' => 'Formulario personalizado',
                    'modulos_asignados' => [(int) $request->modulo_id], // Asegurar que sea entero
                    'activo' => true
                ]);
                \Log::info("Template creado con ID: {$template->id}, módulos: " . json_encode($template->modulos_asignados));
            } else {
                \Log::info("Template existente encontrado con ID: {$template->id}");
            }

            // Si no se proporciona orden, obtener el siguiente disponible
            if (!$request->has('orden')) {
                $maxOrden = $template->campos()->max('orden') ?? 0;
                $request->merge(['orden' => $maxOrden + 1]);
            }

            $campo = FormularioCampo::create([
                'formulario_template_id' => $template->id,
                'nombre_campo' => $request->nombre_campo,
                'etiqueta' => $request->etiqueta,
                'tipo' => $request->tipo,
                'placeholder' => $request->placeholder,
                'descripcion_ayuda' => $request->descripcion_ayuda,
                'requerido' => $request->requerido ?? false,
                'opciones' => $request->opciones,
                'validacion' => $request->validacion,
                'orden' => $request->orden,
                'tamano_columna' => $request->tamano_columna ?? 12
            ]);

            \Log::info("Campo creado exitosamente - ID: {$campo->id}, Template ID: {$template->id}, Nombre: {$campo->nombre_campo}");

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Campo creado exitosamente',
                'campo' => $campo
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear campo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un campo existente
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nombre_campo' => 'nullable|string|max:255',
            'etiqueta' => 'nullable|string|max:255',
            'tipo' => 'nullable|in:text,email,tel,number,date,select,textarea,file,checkbox,radio',
            'placeholder' => 'nullable|string',
            'descripcion_ayuda' => 'nullable|string',
            'requerido' => 'nullable|boolean',
            'opciones' => 'nullable|array',
            'validacion' => 'nullable|string',
            'orden' => 'nullable|integer',
            'tamano_columna' => 'nullable|integer|min:1|max:12',
            'visible' => 'nullable|boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $campo = FormularioCampo::findOrFail($id);
            $campo->update($request->only([
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
                'visible'
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Campo actualizado exitosamente',
                'campo' => $campo
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar campo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un campo
     */
    public function destroy($id)
    {
        try {
            $campo = FormularioCampo::findOrFail($id);
            $campo->delete();

            return response()->json([
                'success' => true,
                'message' => 'Campo eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar campo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reordenar campos
     */
    public function reordenar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'campos' => 'required|array',
            'campos.*.id' => 'required|integer|exists:formulario_campos,id',
            'campos.*.orden' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            foreach ($request->campos as $campoData) {
                FormularioCampo::where('id', $campoData['id'])
                    ->update(['orden' => $campoData['orden']]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Campos reordenados exitosamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al reordenar campos: ' . $e->getMessage()
            ], 500);
        }
    }
}
