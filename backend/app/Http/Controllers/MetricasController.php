<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use App\Models\VotoPregunta;
use App\Models\Pregunta;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MetricasController extends Controller
{
    /**
     * Registrar un voto (útil / no útil) para una pregunta.
     * Ruta pública: POST /api/votos
     */
    public function votar(Request $request): JsonResponse
    {
        $request->validate([
            'pregunta_id' => 'required|integer',
            'voto'        => 'required|in:util,no_util',
        ]);

        $sessionId = $request->cookie('faq_session') ?? $request->header('X-Session-Id');
        $ip        = $request->ip();

        // Un voto por sesión+pregunta (actualiza si ya votó)
        VotoPregunta::updateOrCreate(
            ['pregunta_id' => $request->pregunta_id, 'session_id' => $sessionId, 'ip' => $ip],
            ['voto' => $request->voto]
        );

        // ── Notificaciones a usuarios con permisos sobre el módulo ──
        $pregunta = Pregunta::find($request->pregunta_id);
        if ($pregunta) {
            $moduloId = $pregunta->Idmodulo;
            $tipo     = $request->voto === 'util' ? 'voto_util' : 'voto_no_util';
            $emoji    = $request->voto === 'util' ? '👍' : '👎';

            // Nombre del módulo para el mensaje
            $modulo = \App\Models\Modulo::find($moduloId);
            $moduloNombre = $modulo?->nombre ?? 'Módulo #' . $moduloId;
            $mensaje = "{$emoji} Voto " . ($request->voto === 'util' ? 'útil' : 'no útil')
                     . " en [Módulo: {$moduloNombre}] - Pregunta #{$request->pregunta_id}";

            // Admins + usuarios con permiso directo en el módulo
            $adminIds   = User::where('is_admin', true)->pluck('id');
            $editorIds  = DB::table('modulo_user')->where('modulo_id', $moduloId)->pluck('user_id');
            $destinatarios = $adminIds->merge($editorIds)->unique();

            $notificaciones = $destinatarios->map(fn ($userId) => [
                'user_id'     => $userId,
                'tipo'        => $tipo,
                'pregunta_id' => $request->pregunta_id,
                'modulo_id'   => $moduloId,
                'mensaje'     => $mensaje,
                'leida'       => false,
                'created_at'  => now(),
                'updated_at'  => now(),
            ])->values()->all();

            if (!empty($notificaciones)) {
                Notificacion::insert($notificaciones);
            }
        }

        // Retornar conteos actualizados
        $util    = VotoPregunta::where('pregunta_id', $request->pregunta_id)->where('voto', 'util')->count();
        $no_util = VotoPregunta::where('pregunta_id', $request->pregunta_id)->where('voto', 'no_util')->count();

        return response()->json(['success' => true, 'util' => $util, 'no_util' => $no_util]);
    }

    /**
     * Obtener votos de una pregunta específica.
     * Ruta pública: GET /api/votos/{preguntaId}
     */
    public function votosPregunta(int $preguntaId): JsonResponse
    {
        $util    = VotoPregunta::where('pregunta_id', $preguntaId)->where('voto', 'util')->count();
        $no_util = VotoPregunta::where('pregunta_id', $preguntaId)->where('voto', 'no_util')->count();

        return response()->json(['pregunta_id' => $preguntaId, 'util' => $util, 'no_util' => $no_util]);
    }

    /**
     * Métricas generales para el dashboard admin.
     * Ruta protegida: GET /api/metricas/dashboard
     */
    public function dashboard(): JsonResponse
    {
        $totalTickets = Ticket::count();
        $totalUtil    = VotoPregunta::where('voto', 'util')->count();
        $totalNoUtil  = VotoPregunta::where('voto', 'no_util')->count();
        $totalVotos   = $totalUtil + $totalNoUtil;
        $favorabilidad = $totalVotos > 0 ? round(($totalUtil / $totalVotos) * 100, 1) : null;

        // Top 5 preguntas más votadas (útil)
        $topUtil = VotoPregunta::where('voto', 'util')
            ->selectRaw('pregunta_id, count(*) as total')
            ->groupBy('pregunta_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $pregunta = Pregunta::find($row->pregunta_id);
                return [
                    'pregunta_id' => $row->pregunta_id,
                    'pregunta'    => $pregunta?->Pregunta ?? 'Pregunta eliminada',
                    'total'       => $row->total,
                ];
            });

        // Top 5 preguntas con más "no útil"
        $topNoUtil = VotoPregunta::where('voto', 'no_util')
            ->selectRaw('pregunta_id, count(*) as total')
            ->groupBy('pregunta_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $pregunta = Pregunta::find($row->pregunta_id);
                return [
                    'pregunta_id' => $row->pregunta_id,
                    'pregunta'    => $pregunta?->Pregunta ?? 'Pregunta eliminada',
                    'total'       => $row->total,
                ];
            });

        return response()->json([
            'tickets'       => $totalTickets,
            'votos_util'    => $totalUtil,
            'votos_no_util' => $totalNoUtil,
            'total_votos'   => $totalVotos,
            'favorabilidad' => $favorabilidad,
            'top_util'      => $topUtil,
            'top_no_util'   => $topNoUtil,
        ]);
    }

    /**
     * Exportar votos a CSV (descargable desde el admin).
     * Ruta protegida: GET /api/metricas/exportar-csv
     */
    public function exportarCsv(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $votos = VotoPregunta::orderBy('created_at', 'desc')->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="votos_preguntas_' . date('Ymd_His') . '.csv"',
        ];

        return response()->stream(function () use ($votos) {
            $handle = fopen('php://output', 'w');
            // BOM para Excel
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($handle, ['ID', 'Pregunta ID', 'Pregunta', 'Voto', 'IP', 'Fecha'], ';');

            foreach ($votos as $voto) {
                $pregunta = Pregunta::find($voto->pregunta_id);
                fputcsv($handle, [
                    $voto->id,
                    $voto->pregunta_id,
                    $pregunta?->Pregunta ?? 'Eliminada',
                    $voto->voto === 'util' ? 'Útil 👍' : 'No útil 👎',
                    $voto->ip,
                    $voto->created_at->setTimezone('America/Bogota')->format('d/m/Y H:i:s'),
                ], ';');
            }
            fclose($handle);
        }, 200, $headers);
    }
}
