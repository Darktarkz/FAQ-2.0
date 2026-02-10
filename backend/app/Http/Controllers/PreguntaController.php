<?php

namespace App\Http\Controllers;

use App\Models\Pregunta;
use App\Models\Modulo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class PreguntaController extends Controller
{
    /**
     * Obtener todas las preguntas
     * GET /api/preguntas?id_modulo=1 (opcional para filtrar por módulo)
     */
    public function index(Request $request): JsonResponse
    {
        // Ordenamos por el campo orden y luego por id
        $query = Pregunta::query()
            ->orderBy('orden', 'asc')
            ->orderBy('ID', 'asc');

        // Filtrar por módulo si se proporciona el parámetro
        if ($request->has('id_modulo')) {
            $query->where('Idmodulo', $request->input('id_modulo'));
        }

        $preguntas = $query->get();
        return response()->json($preguntas);
    }

    /**
     * Crear una nueva pregunta
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'Idmodulo' => 'required|integer|exists:modulos,id',
            'Aplicativo' => 'nullable|string|max:255',
            'Pregunta' => 'required|string',
            'Respuesta' => 'required|string',
        ]);

        $this->authorizeModulo($request->user(), (int) $validated['Idmodulo']);

        // Obtener el máximo orden actual para el módulo
        $maxOrden = Pregunta::where('Idmodulo', $validated['Idmodulo'])->max('orden') ?? 0;
        $validated['orden'] = $maxOrden + 1;

        $pregunta = Pregunta::create($validated);

        return response()->json([
            'message' => 'Pregunta creada exitosamente',
            'data' => $pregunta
        ], 201);
    }

    /**
     * Obtener una pregunta específica
     */
    public function show($id): JsonResponse
    {
        $pregunta = Pregunta::find($id);

        if (!$pregunta) {
            return response()->json([
                'message' => 'Pregunta no encontrada'
            ], 404);
        }

        return response()->json($pregunta);
    }

    /**
     * Actualizar una pregunta
     */
    public function update(Request $request, $id): JsonResponse
    {
        $pregunta = Pregunta::find($id);

        if (!$pregunta) {
            return response()->json([
                'message' => 'Pregunta no encontrada'
            ], 404);
        }

        $validated = $request->validate([
            'Idmodulo' => 'required|integer|exists:modulos,id',
            'Aplicativo' => 'nullable|string|max:255',
            'Pregunta' => 'required|string',
            'Respuesta' => 'required|string',
        ]);

        $this->authorizeModulo($request->user(), (int) $validated['Idmodulo']);

        $pregunta->update($validated);

        return response()->json([
            'message' => 'Pregunta actualizada exitosamente',
            'data' => $pregunta
        ]);
    }

    /**
     * Eliminar una pregunta
     */
    public function destroy($id): JsonResponse
    {
        $pregunta = Pregunta::find($id);

        if (!$pregunta) {
            return response()->json([
                'message' => 'Pregunta no encontrada'
            ], 404);
        }

        $this->authorizeModulo(request()->user(), (int) $pregunta->Idmodulo);

        $pregunta->delete();

        return response()->json([
            'message' => 'Pregunta eliminada exitosamente'
        ]);
    }

    /**
     * Buscar preguntas por término
     */
    public function search(Request $request): JsonResponse
    {
        $term = $request->query('q', '');
        
        $preguntas = Pregunta::where('Pregunta', 'LIKE', "%{$term}%")
            ->orWhere('Respuesta', 'LIKE', "%{$term}%")
            ->orWhere('Modulo', 'LIKE', "%{$term}%")
            ->orWhere('Aplicativo', 'LIKE', "%{$term}%")
            ->get();

        return response()->json($preguntas);
    }

    /**
     * Subir una imagen desde portapapeles/editor y devolver la URL pública
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'imagen' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
        ]);

        $path = $request->file('imagen')->store('preguntas', 'public');
        $url = Storage::url($path);

        return response()->json(['url' => asset($url)], 201);
    }

    /**
     * DEBUG: Obtener información sobre la estructura de datos
     */
    public function debug(): JsonResponse
    {
        // Obtener primeras 5 preguntas con todos sus campos
        $preguntas = Pregunta::limit(5)->get();
        
        // Obtener todos los valores únicos de Idmodulo
        $idmodulos = Pregunta::distinct()->pluck('Idmodulo')->sort()->values();
        
        // Contar preguntas por Idmodulo
        $conteoIdmodulo = \DB::table('preguntas')
            ->selectRaw('Idmodulo, COUNT(*) as cantidad')
            ->groupBy('Idmodulo')
            ->get();
        
        return response()->json([
            'total_preguntas' => Pregunta::count(),
            'primeras_5_preguntas' => $preguntas,
            'idmodulos_unicos' => $idmodulos,
            'conteo_por_idmodulo' => $conteoIdmodulo,
            'nota' => 'Este endpoint ayuda a debuggear la estructura de datos'
        ]);
    }

    /**
     * Limpiar números del inicio de las preguntas
     * POST /api/preguntas/limpiar-numeros
     * 
     * Elimina patrones como "1. ", "2.", "15. " del inicio del campo Pregunta
     * sin modificar el resto del contenido
     */
    public function limpiarNumeros(Request $request): JsonResponse
    {
        // Modo de prueba: muestra qué se cambiaría sin modificar la BD
        $dryRun = $request->input('dry_run', false);
        
        // Obtener todas las preguntas
        $preguntas = Pregunta::all();
        $modificadas = [];
        $sinCambios = [];
        $contador = 0;

        foreach ($preguntas as $pregunta) {
            $textoOriginal = $pregunta->Pregunta;
            
            // Eliminar números del inicio: "1. ", "2.", "123. ", etc.
            // Patrón: ^[0-9]+\.?\s* (uno o más dígitos, punto opcional, espacios opcionales al inicio)
            $textoLimpio = preg_replace('/^\s*[0-9]+\.?\s*/', '', $textoOriginal);
            
            // Si hubo cambios
            if ($textoLimpio !== $textoOriginal) {
                $modificadas[] = [
                    'id' => $pregunta->ID,
                    'original' => $textoOriginal,
                    'limpio' => $textoLimpio
                ];
                
                // Si no es modo prueba, guardar cambios
                if (!$dryRun) {
                    $pregunta->Pregunta = $textoLimpio;
                    $pregunta->save();
                    $contador++;
                }
            } else {
                $sinCambios[] = [
                    'id' => $pregunta->ID,
                    'texto' => $textoOriginal
                ];
            }
        }

        return response()->json([
            'success' => true,
            'dry_run' => $dryRun,
            'total_preguntas' => $preguntas->count(),
            'modificadas' => count($modificadas),
            'sin_cambios' => count($sinCambios),
            'guardadas' => $contador,
            'detalles_modificadas' => $modificadas,
            'mensaje' => $dryRun 
                ? 'Vista previa: no se modificó la base de datos' 
                : "Se limpiaron $contador preguntas exitosamente"
        ]);
    }

    /**
     * Reordenar preguntas mediante drag and drop
     * PUT /api/preguntas/reordenar
     * 
     * Recibe un array de IDs en el nuevo orden
     * Actualiza el campo orden de cada pregunta
     */
    public function reordenar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'preguntas' => 'required|array',
            'preguntas.*.id' => 'required|integer|exists:preguntas,ID',
            'preguntas.*.orden' => 'required|integer|min:0',
        ]);

        try {
            \DB::beginTransaction();

            foreach ($validated['preguntas'] as $item) {
                $pregunta = Pregunta::find($item['id']);
                
                // Verificar permisos
                $this->authorizeModulo($request->user(), (int) $pregunta->Idmodulo);
                
                $pregunta->orden = $item['orden'];
                $pregunta->save();
            }

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Preguntas reordenadas exitosamente',
                'total_actualizadas' => count($validated['preguntas'])
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Error al reordenar preguntas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permite solo a administradores o responsables del módulo (y sus hijos).
     */
    private function authorizeModulo($user, int $moduloId): void
    {
        if (!$user || !$user->canManageModulo($moduloId)) {
            abort(403, 'No tienes permisos para gestionar preguntas en este módulo');
        }
    }
}
