<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ModuloController extends Controller
{
    /**
     * Obtener todos los módulos
     * GET /api/modulos
     */
    public function index(): JsonResponse
    {
        $modulos = Modulo::all();
        return response()->json($modulos, 200);
    }

    /**
     * Obtener un módulo por ID
     * GET /api/modulos/{id}
     */
    public function show($id): JsonResponse
    {
        $modulo = Modulo::findOrFail($id);
        return response()->json($modulo, 200);
    }

    /**
     * Obtener módulos por categoría
     * GET /api/categorias/{id}/modulos
     */
    public function porCategoria($categoriaId): JsonResponse
    {
        $modulos = Modulo::where('id_categoria', $categoriaId)->get();
        return response()->json($modulos, 200);
    }

    /**
     * Obtener submódulos (módulos hijos) de un módulo padre
     * GET /api/modulos/{id}/submodulos
     */
    public function submodulos($moduloPadreId): JsonResponse
    {
        // Este método no se usa en la estructura actual
        return response()->json([], 200);
    }

    /**
     * Crear un nuevo módulo
     * POST /api/modulos
     */
    public function store(Request $request): JsonResponse
    {
        $key = (new Modulo())->getKeyName();

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'idpadre' => "nullable|integer|exists:modulos,{$key}",
            'icono' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // Max 2MB
        ]);

        // Si no es admin, verificar permisos sobre el padre
        if (!$request->user()->isAdmin()) {
            if (empty($validated['idpadre'])) {
                return response()->json(['message' => 'Solo administradores pueden crear módulos raíz'], 403);
            }
            
            if (!$request->user()->canManageModulo((int) $validated['idpadre'])) {
                return response()->json(['message' => 'No tienes permisos sobre el módulo padre'], 403);
            }
        }

        // Manejar subida de icono
        if ($request->hasFile('icono')) {
            $iconoPath = $request->file('icono')->store('iconos', 'public');
            $validated['icono'] = $iconoPath;
        }

        $modulo = Modulo::create($validated);
        return response()->json($modulo, 201);
    }

    /**
     * Actualizar un módulo
     * PUT /api/modulos/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $modulo = Modulo::findOrFail($id);
        $key = $modulo->getKeyName();

        // Si no es admin, verificar permisos sobre el módulo
        if (!$request->user()->isAdmin()) {
            if (!$request->user()->canManageModulo((int) $id)) {
                return response()->json(['message' => 'No tienes permisos sobre este módulo'], 403);
            }
        }
        
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string',
            'idpadre' => "nullable|integer|exists:modulos,{$key}",
            'icono' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // Manejar subida de nuevo icono
        if ($request->hasFile('icono')) {
            // Eliminar icono anterior si existe
            if ($modulo->icono) {
                Storage::disk('public')->delete($modulo->icono);
            }
            $iconoPath = $request->file('icono')->store('iconos', 'public');
            $validated['icono'] = $iconoPath;
        }

        $modulo->update($validated);
        return response()->json($modulo, 200);
    }

    /**
     * Eliminar un módulo
     * DELETE /api/modulos/{id}
     */
    public function destroy($id): JsonResponse
    {
        $modulo = Modulo::findOrFail($id);

        if (!request()->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // Bloquear eliminación si tiene hijos o preguntas asociadas
        $tieneHijos = DB::table('modulos')->where('id_padre', $id)->exists();
        if ($tieneHijos) {
            return response()->json([
                'message' => 'No se puede eliminar el módulo porque tiene submódulos asociados'
            ], 409);
        }

        $tienePreguntas = DB::table('preguntas')->where('Idmodulo', $id)->exists();
        if ($tienePreguntas) {
            return response()->json([
                'message' => 'No se puede eliminar el módulo porque tiene preguntas asociadas'
            ], 409);
        }

        // Eliminar icono si existe
        if ($modulo->icono) {
            Storage::disk('public')->delete($modulo->icono);
        }

        $modulo->delete();
        return response()->json(['message' => 'Módulo eliminado'], 200);
    }
}