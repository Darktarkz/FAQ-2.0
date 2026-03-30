<?php

namespace App\Http\Controllers;

use App\Models\Dependencia;
use Illuminate\Http\JsonResponse;

class DependenciaController extends Controller
{
    public function index(): JsonResponse
    {
        $dependencias = Dependencia::activos()->orderBy('nombre')->get(['id', 'nombre']);

        return response()->json([
            'success' => true,
            'dependencias' => $dependencias,
        ]);
    }
}
