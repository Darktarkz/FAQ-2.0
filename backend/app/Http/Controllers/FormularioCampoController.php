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
     * Obtener campos personalizados de un módulo.
     * Si se pasa ?pregunta_id=X, busca primero el template específico de esa pregunta;
     * si no existe, cae al template del módulo (fallback).
     */
    public function getPorModulo(Request $request, $moduloId)
    {
        try {
            \Log::info("Buscando campos para módulo: {$moduloId}");

            $template = null;
            $origenTemplate = 'modulo';

            // 1. Si viene pregunta_id, buscar template exclusivo de esa pregunta
            if ($request->filled('pregunta_id')) {
                $template = FormularioTemplate::porPregunta($request->input('pregunta_id'));
                if ($template) {
                    // solicitud_acceso no tiene campos por diseño: siempre usarlo
                    if ($template->tipo === 'solicitud_acceso') {
                        $origenTemplate = 'pregunta';
                    } else {
                        // Para tipo personalizado: usar solo si tiene campos visibles, si no fallback al módulo
                        $tieneCamposVisibles = $template->campos()->where('visible', 1)->exists();
                        if ($tieneCamposVisibles) {
                            $origenTemplate = 'pregunta';
                        } else {
                            $template = null; // Fallback al módulo
                        }
                    }
                }
            }

            // 2. Fallback con herencia jerárquica (sube por idpadre hasta encontrar template)
            $origenModuloId = null;
            if (!$template) {
                $resultado = FormularioTemplate::porModuloConHerencia((int) $moduloId);
                $template = $resultado['template'];
                $origenModuloId = $resultado['origen_modulo_id'];
            } else {
                // Template encontrado vía pregunta: el origen es el propio módulo
                $origenModuloId = (int) $moduloId;
            }

            if (!$template) {
                \Log::info("No se encontró template para módulo: {$moduloId}");
                return response()->json([
                    'success'          => true,
                    'campos'           => [],
                    'origen_template'  => null,
                    'origen_modulo_id' => null,
                ]);
            }

            // Filtrar directamente en BD (más confiable que PHP-side)
            if ($request->has('incluir_ocultos')) {
                $campos = $template->campos()->orderBy('orden')->get();
            } else {
                $campos = $template->campos()->where('visible', 1)->orderBy('orden')->get();
            }

            \Log::info("Template encontrado ({$origenTemplate}) con {$campos->count()} campos para módulo: {$moduloId}", [
                'incluir_ocultos' => $request->has('incluir_ocultos'),
                'campos_visible' => $campos->pluck('visible', 'id')->toArray()
            ]);

            return response()->json([
                'success'          => true,
                'template_id'      => $template->id,
                'tipo'             => $template->tipo ?? 'personalizado',
                'origen_template'  => $origenTemplate,
                'origen_modulo_id' => $origenModuloId,
                'campos'           => $campos
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
     * Obtener campos de una pregunta específica (uso admin).
     * Devuelve solo el template exclusivo de esa pregunta (sin fallback).
     */
    public function getPorPregunta(Request $request, $preguntaId)
    {
        try {
            $template = FormularioTemplate::porPregunta($preguntaId);

            if (!$template) {
                return response()->json([
                    'success' => true,
                    'template_id' => null,
                    'tipo' => null,
                    'campos' => []
                ]);
            }

            $campos = $template->campos()->orderBy('orden')->get();

            return response()->json([
                'success' => true,
                'template_id' => $template->id,
                'tipo' => $template->tipo ?? 'personalizado',
                'campos' => $campos
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Establecer el tipo de formulario de una pregunta (personalizado | solicitud_acceso).
     * Crea el FormularioTemplate si no existe.
     */
    public function setTipoPregunta(Request $request, $preguntaId)
    {
        $validator = Validator::make($request->all(), [
            'tipo' => 'required|in:personalizado,solicitud_acceso',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            $template = FormularioTemplate::porPregunta($preguntaId);

            if (!$template) {
                $template = FormularioTemplate::create([
                    'nombre'            => 'Formulario Pregunta ' . $preguntaId,
                    'descripcion'       => 'Formulario específico de pregunta',
                    'modulos_asignados' => [],
                    'pregunta_id'       => (int) $preguntaId,
                    'activo'            => true,
                    'tipo'              => $request->tipo,
                ]);
            } else {
                $template->update(['tipo' => $request->tipo]);
            }

            return response()->json([
                'success'  => true,
                'tipo'     => $template->tipo,
                'template' => $template,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al guardar tipo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo campo personalizado
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'modulo_id' => 'nullable|integer|exists:modulos,id',
            'pregunta_id' => 'nullable|integer',
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

        // Requiere modulo_id O pregunta_id
        if (!$request->filled('modulo_id') && !$request->filled('pregunta_id')) {
            return response()->json([
                'success' => false,
                'message' => 'Se requiere modulo_id o pregunta_id'
            ], 422);
        }

        try {
            DB::beginTransaction();

            $template = null;

            // Si se proporciona pregunta_id, buscar/crear template de pregunta
            if ($request->filled('pregunta_id')) {
                $template = FormularioTemplate::porPregunta($request->pregunta_id);
                if (!$template) {
                    \Log::info("Creando nuevo template para pregunta: {$request->pregunta_id}");
                    $template = FormularioTemplate::create([
                        'nombre' => 'Formulario Pregunta ' . $request->pregunta_id,
                        'descripcion' => 'Formulario específico de pregunta',
                        'modulos_asignados' => [],
                        'pregunta_id' => (int) $request->pregunta_id,
                        'activo' => true
                    ]);
                    \Log::info("Template de pregunta creado con ID: {$template->id}");
                } else {
                    \Log::info("Template de pregunta existente encontrado con ID: {$template->id}");
                }
            } else {
                // Buscar o crear template para este módulo
                $template = FormularioTemplate::porModulo($request->modulo_id);
                if (!$template) {
                    \Log::info("Creando nuevo template para módulo: {$request->modulo_id}");
                    $template = FormularioTemplate::create([
                        'nombre' => 'Formulario Módulo ' . $request->modulo_id,
                        'descripcion' => 'Formulario personalizado',
                        'modulos_asignados' => [(int) $request->modulo_id],
                        'activo' => true
                    ]);
                    \Log::info("Template creado con ID: {$template->id}, módulos: " . json_encode($template->modulos_asignados));
                } else {
                    \Log::info("Template existente encontrado con ID: {$template->id}");
                }
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
                'tamano_columna' => $request->tamano_columna ?? 12,
                'visible' => $request->visible ?? true,
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
            
            $datos = $request->only([
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
            ]);
            
            // Manejar 'visible' CON DB::table directo para evitar que el cast boolean
            // de Eloquent interfiera con el INSERT en MariaDB TINYINT
            $visibleValue = null;
            if ($request->exists('visible')) {
                $visibleValue = filter_var($request->input('visible'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
            }
            
            \Log::info("Actualizando campo ID: {$id}", [
                'datos' => $datos,
                'visible_nuevo' => $visibleValue,
                'visible_antes' => $campo->getRawOriginal('visible'),
            ]);
            
            // Actualizar campos normales con Eloquent
            if (!empty($datos)) {
                $campo->update($datos);
            }
            
            // Actualizar visible directamente en BD (bypassa el cast boolean de Eloquent)
            if ($visibleValue !== null) {
                DB::table('formulario_campos')->where('id', $id)->update(['visible' => $visibleValue]);
            }
            
            $campo->refresh();
            
            \Log::info("Campo actualizado ID: {$id}", ['visible_despues' => $campo->visible]);

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
