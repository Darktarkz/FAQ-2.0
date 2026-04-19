<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    /**
     * Obtener las últimas notificaciones del usuario autenticado.
     * GET /api/notificaciones
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notificaciones = Notificacion::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get(['id', 'tipo', 'pregunta_id', 'modulo_id', 'mensaje', 'leida', 'created_at']);

        $totalNoLeidas = Notificacion::where('user_id', $user->id)
            ->where('leida', false)
            ->count();

        return response()->json([
            'notificaciones'   => $notificaciones,
            'total_no_leidas'  => $totalNoLeidas,
        ]);
    }

    /**
     * Marcar una notificación como leída.
     * PUT /api/notificaciones/{id}/leer
     */
    public function marcarLeida(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $notificacion = Notificacion::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $notificacion->update(['leida' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Marcar todas las notificaciones del usuario como leídas.
     * PUT /api/notificaciones/leer-todas
     */
    public function marcarTodasLeidas(Request $request): JsonResponse
    {
        $user = $request->user();

        Notificacion::where('user_id', $user->id)
            ->where('leida', false)
            ->update(['leida' => true]);

        return response()->json(['success' => true]);
    }
}
