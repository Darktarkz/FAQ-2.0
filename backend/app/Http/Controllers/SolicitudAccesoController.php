<?php

namespace App\Http\Controllers;

use App\Mail\SolicitudAccesoMail;
use App\Models\SolicitudAcceso;
use App\Http\Requests\StoreSolicitudAccesoRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class SolicitudAccesoController extends Controller
{
    /** Correo destino GLPI — configurable en .env con MAIL_SOPORTE_TO */
    private function glpiEmail(): string
    {
        return env('MAIL_SOPORTE_TO', 'soporte.ti@idartes.gov.co');
    }

    /** Nombres legibles para cada ID de dependencia */
    private const NOMBRES_DEPENDENCIA = [
        1  => 'Dirección General',
        2  => 'Subdirección de las Artes',
        3  => 'Subdirección de Formación Artística',
        4  => 'Subdirección de Equipamientos Culturales',
        5  => 'Subdirección Administrativa y Financiera',
        6  => 'Oficina Asesora Planeación y tecnologías de la información',
        7  => 'Subdirección Jurídica',
        8  => 'Asesoría de Comunicaciones',
        9  => 'Asesoría de Control Interno',
        10 => 'Gerencia de Danza',
        11 => 'Gerencia de Artes Audiovisuales',
        12 => 'Gerencia de Escenarios',
        13 => 'Gerencia de Arte Dramático',
        14 => 'Gerencia de Artes Plásticas y Visuales',
        15 => 'Gerencia de Música',
        16 => 'Gerencia de Literatura',
        17 => 'Talento Humano',
        18 => 'Gerencia Nidos',
        19 => 'Gerencia Crea',
        20 => 'Línea Estratégica Arte Ciencia y Tecnología',
        21 => 'Línea Estratégica Emprendimiento',
        22 => 'Convocatorias',
        23 => 'Teatro Mayor Julio Mario Santo Domingo',
        24 => 'Planetario de Bogotá',
        25 => 'Área de Producción',
        26 => 'Servicios Generales',
        27 => 'Gestión Documental',
        28 => 'Culturas en Común',
        29 => 'Linea Arte y Memoria sin Fronteras',
        30 => 'GALERÍA Santa Fe',
        31 => 'Gerencia de Contratación',
        32 => 'Subdirección de Infraestructura',
        33 => 'Gerencia de Escenarios Territoriales',
    ];

    /** Nombres legibles para cada clave de plataforma */
    private const NOMBRES_PLATAFORMA = [
        'sif'           => 'SIF',
        'orfeo'         => 'ORFEO',
        'contratacion'  => 'SISTEMA DE CONTRATACIÓN',
        'caja_menor'    => 'CAJA MENOR',
        'sicapital'     => 'SICAPITAL',
        'pandora'       => 'PANDORA',
    ];
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

        // ─── Enviar un correo independiente por cada plataforma seleccionada ────

        $datosUsuario = [
            'nombre_completo'  => $solicitud->nombre_completo,
            'tipo_documento'   => $solicitud->tipo_documento,
            'numero_documento' => $solicitud->numero_documento,
            'usuario_red'      => $solicitud->usuario_red,
            'correo'           => $solicitud->correo,
            'dependencia'      => self::NOMBRES_DEPENDENCIA[$solicitud->dependencia_id] ?? "Dependencia #{$solicitud->dependencia_id}",
            'cargo_tipo'       => $solicitud->cargo_tipo,
            'cargo_nombre'     => $solicitud->cargo_nombre,
        ];

        $destino = $this->glpiEmail();

        foreach ($plataformas as $key => $data) {
            $nombrePlataforma = self::NOMBRES_PLATAFORMA[$key] ?? strtoupper($key);
            $firmaPath = $data['firma_path'] ?? null;

            try {
                Mail::to($destino)->send(
                    new SolicitudAccesoMail($datosUsuario, $nombrePlataforma, $data, $firmaPath, $solicitud->id)
                );
            } catch (\Throwable $e) {
                Log::error("Error enviando correo de solicitud de acceso [{$nombrePlataforma}]: " . $e->getMessage(), [
                    'solicitud_id' => $solicitud->id,
                    'plataforma'   => $key,
                ]);
            }
        }

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
