<?php

namespace App\Http\Controllers;

use App\Models\SolicitudAcceso;
use App\Http\Requests\StoreSolicitudAccesoRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class SolicitudAccesoController extends Controller
{
    /**
     * Crear una nueva solicitud de acceso (público, sin autenticación)
     */
    public function store(StoreSolicitudAccesoRequest $request): JsonResponse
    {
        $plataformas = json_decode($request->plataformas, true);

        // Validar que venga al menos una plataforma
        if (empty($plataformas)) {
            return response()->json([
                'success' => false,
                'message' => 'Debe seleccionar al menos una plataforma.',
            ], 422);
        }

        // Procesar archivos de firma (ORFEO y/o CONTRATACIÓN)
        foreach (['orfeo_firma', 'contratacion_firma'] as $campo) {
            if ($request->hasFile($campo)) {
                $file = $request->file($campo);
                $filename = time() . '_' . $campo . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('solicitudes/firmas', $filename, 'public');

                // Agregar ruta al JSON de plataformas
                $plataformaKey = str_replace('_firma', '', $campo);
                if (isset($plataformas[$plataformaKey])) {
                    $plataformas[$plataformaKey]['firma_path'] = $path;
                }
            }
        }

        $solicitud = SolicitudAcceso::create([
            'nombre_completo'  => $request->nombre_completo,
            'tipo_documento'   => $request->tipo_documento,
            'numero_documento' => $request->numero_documento,
            'usuario_red'      => $request->usuario_red,
            'correo'           => $request->correo,
            'dependencia_id'   => $request->dependencia_id,
            'cargo_tipo'       => $request->cargo_tipo,
            'cargo_nombre'     => $request->cargo_nombre,
            'plataformas'      => $plataformas,
        ]);

        $solicitud->load('dependencia');

        return response()->json([
            'success'   => true,
            'message'   => 'Solicitud de acceso registrada exitosamente.',
            'solicitud' => $solicitud,
        ], 201);
    }

    /**
     * Listar solicitudes (protegido — solo admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = SolicitudAcceso::with('dependencia')->latest();

        if ($request->filled('estado')) {
            $query->porEstado($request->estado);
        }

        $solicitudes = $query->paginate(20);

        return response()->json([
            'success'     => true,
            'solicitudes' => $solicitudes,
        ]);
    }

    /**
     * Ver detalle de una solicitud (protegido — solo admin)
     */
    public function show(int $id): JsonResponse
    {
        $solicitud = SolicitudAcceso::with('dependencia')->findOrFail($id);

        return response()->json([
            'success'   => true,
            'solicitud' => $solicitud,
        ]);
    }

    /**
     * Actualizar estado de una solicitud (protegido — solo admin)
     */
    public function updateEstado(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'estado' => 'required|in:pendiente,en_proceso,resuelto',
        ]);

        $solicitud = SolicitudAcceso::findOrFail($id);
        $solicitud->update(['estado' => $request->estado]);

        return response()->json([
            'success'   => true,
            'message'   => 'Estado actualizado correctamente.',
            'solicitud' => $solicitud,
        ]);
    }
}
