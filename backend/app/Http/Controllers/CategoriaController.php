<?php

namespace App\Http\Controllers;

use App\Models\Modulo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoriaController extends Controller
{
    /**
     * Obtener todas las categorías (módulos con idpadre NULL)
     * GET /api/categorias
     */
    public function index(): JsonResponse
    {
        $categorias = Modulo::whereNull('idpadre')->get();
        return response()->json($categorias, 200);
    }

    /**
     * Obtener una categoría por ID (módulo específico)
     * GET /api/categorias/{id}
     */
    public function show($id): JsonResponse
    {
        $categoria = Modulo::findOrFail($id);
        return response()->json($categoria, 200);
    }

    /**
     * Crear una nueva categoría (módulo sin padre)
     * POST /api/categorias
     */
    public function store(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'id_categoria' => 'required|integer|exists:categorias,id',
        ]);

        $categoria = Modulo::create($validated);
        return response()->json($categoria, 201);
    }

    /**
     * Actualizar una categoría (módulo)
     * PUT /api/categorias/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $categoria = Modulo::findOrFail($id);

        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }
        
        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $categoria->update($validated);
        return response()->json($categoria, 200);
    }

    /**
     * Eliminar una categoría (módulo)
     * DELETE /api/categorias/{id}
     */
    public function destroy($id): JsonResponse
    {
        $categoria = Modulo::findOrFail($id);

        if (!request()->user()->isAdmin()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }
        $categoria->delete();
        return response()->json(['message' => 'Categoría eliminada'], 200);
    }
}