<?php

namespace App\Http\Controllers;

use App\Models\Categoria;
use App\Models\Modulo;
use App\Models\Pregunta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Búsqueda global en el panel admin.
     * GET /api/admin/search?q={término}
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim($request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json([
                'modulos'    => [],
                'preguntas'  => [],
                'categorias' => [],
            ]);
        }

        /** @var \App\Models\User $user */
        $user    = $request->user();
        $isAdmin = $user->is_admin;
        $term    = '%' . $q . '%';

        // ── Módulos ────────────────────────────────────────────────
        $modulosQuery = Modulo::where(function ($query) use ($term) {
            $query->where('nombre', 'like', $term)
                  ->orWhere('descripcion', 'like', $term);
        })->limit(5);

        if (!$isAdmin) {
            $permitted = $user->permittedModuloIds();
            $modulosQuery->whereIn('id', $permitted);
        }

        $modulos = $modulosQuery->get(['id', 'nombre', 'descripcion']);

        // ── Preguntas ──────────────────────────────────────────────
        $preguntasQuery = Pregunta::where(function ($query) use ($term) {
            $query->where('Pregunta', 'like', $term)
                  ->orWhere('Aplicativo', 'like', $term);
        })->limit(5);

        if (!$isAdmin) {
            $permitted = $user->permittedModuloIds();
            $preguntasQuery->whereIn('Idmodulo', $permitted);
        }

        $preguntas = $preguntasQuery->get(['ID as id', 'Pregunta as titulo', 'Idmodulo as modulo_id', 'Aplicativo as modulo_nombre']);

        // ── Categorías (solo admin) ────────────────────────────────
        $categorias = [];
        if ($isAdmin) {
            $categorias = Categoria::where('nombre', 'like', $term)
                ->limit(5)
                ->get(['id', 'nombre']);
        }

        return response()->json([
            'modulos'    => $modulos,
            'preguntas'  => $preguntas,
            'categorias' => $categorias,
        ]);
    }
}
