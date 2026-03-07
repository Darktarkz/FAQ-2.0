<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\Modulo;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class TicketController extends Controller
{
    /**
     * Crear un nuevo ticket de soporte
     */
    public function store(Request $request): JsonResponse
    {
        \Log::info('Ticket store - datos recibidos: ', [
            'modulo_id' => $request->input('modulo_id'),
            'tiene_campos' => $request->has('campos_personalizados'),
            'campos_json' => $request->input('campos_personalizados'),
        ]);

        $validator = Validator::make($request->all(), [
            'modulo_id' => 'required|exists:modulos,id',
            'campos_personalizados' => 'required|json',
            'screenshot' => 'nullable|image|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            \Log::error('Ticket store - validacion fallida: ', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Datos inválidos: ' . implode(', ', $validator->errors()->all()),
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generar número de ticket
            $numeroTicket = Ticket::generarNumeroTicket();

            // Procesar screenshot si existe
            $screenshotPath = null;
            if ($request->hasFile('screenshot')) {
                $file = $request->file('screenshot');
                $filename = $numeroTicket . '_' . time() . '.' . $file->getClientOriginalExtension();
                $screenshotPath = $file->storeAs('tickets/screenshots', $filename, 'public');
            }

            // Decodificar campos personalizados
            $camposPersonalizados = json_decode($request->campos_personalizados, true) ?? [];

            // Extraer campos legacy desde campos_personalizados (la tabla los requiere NOT NULL)
            $nombreCompleto = $camposPersonalizados['nombre_completo']
                ?? $camposPersonalizados['nombre']
                ?? $camposPersonalizados['nombre_colaborador']
                ?? 'N/A';
            $correo = $camposPersonalizados['correo']
                ?? $camposPersonalizados['email']
                ?? $camposPersonalizados['correo_electronico']
                ?? 'N/A';
            $descripcion = $camposPersonalizados['descripcion']
                ?? $camposPersonalizados['problema']
                ?? $camposPersonalizados['descripcion_problema']
                ?? 'Ver campos personalizados';

            // Crear ticket
            $ticket = Ticket::create([
                'numero_ticket'        => $numeroTicket,
                'modulo_id'            => $request->modulo_id,
                'nombre_completo'      => $nombreCompleto,
                'correo'               => $correo,
                'descripcion'          => $descripcion,
                'campos_personalizados'=> $camposPersonalizados,
                'screenshot_path'      => $screenshotPath,
            ]);

            // Cargar relación del módulo
            $ticket->load('modulo');

            // Enviar correo de notificación (no bloquear si falla)
            try {
                // Recoger archivos de campos personalizados (archivo_*)
                $archivosCustom = [];
                foreach ($request->allFiles() as $key => $file) {
                    if (str_starts_with($key, 'archivo_')) {
                        $nombreCampo = substr($key, strlen('archivo_'));
                        $archivosCustom[$nombreCampo] = $file;
                    }
                }
                $this->enviarCorreoSoporte($ticket, $request->file('screenshot'), $camposPersonalizados, $archivosCustom);
            } catch (\Throwable $mailError) {
                \Log::error('Error al enviar correo del ticket ' . $ticket->numero_ticket . ': ' . $mailError->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Ticket creado exitosamente',
                'ticket' => $ticket
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el ticket: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enviar correo de notificación usando PHPMailer
     */
    private function enviarCorreoSoporte(Ticket $ticket, $screenshotFile = null, array $camposRaw = [], array $archivosCustom = [])
    {
        $mail = new PHPMailer(true);

        try {
            // Configuración del servidor desde .env
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME');
            $mail->Password   = env('MAIL_PASSWORD');
            $mail->Port       = (int) env('MAIL_PORT', 587);
            $mail->CharSet    = 'UTF-8';

            $encryption = strtolower(env('MAIL_ENCRYPTION', 'tls'));
            if ($encryption === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMIME;
            } else {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // tls
            }

            // Remitente y destinatario
            $mail->setFrom(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME', 'Sistema de Tickets IDARTES'));
            $mail->addAddress(env('MAIL_SOPORTE_TO', 'jineth.moreno@idartes.gov.co'));
            $mailCC = env('MAIL_SOPORTE_CC');
            if ($mailCC && filter_var($mailCC, FILTER_VALIDATE_EMAIL)) {
                $mail->addCC($mailCC);
            }

            // Cargar etiquetas reales del template del módulo
            $etiquetas = [];
            $template = \App\Models\FormularioTemplate::porModulo($ticket->modulo_id);
            if ($template) {
                foreach ($template->campos as $campo) {
                    $etiquetas[$campo->nombre_campo] = $campo->etiqueta;
                }
            }

            // Usar los campos pasados directamente (más fiables que releer del modelo)
            $camposData = !empty($camposRaw) ? $camposRaw : ($ticket->campos_personalizados ?? []);
            \Log::info('enviarCorreo - camposData: ', $camposData);

            // Extraer metadatos de contexto (prefijo _)
            $preguntaNombre = $camposData['_pregunta_nombre'] ?? null;

            // Determinar módulo / submódulo
            $modulo = $ticket->modulo;
            $moduloNombre = $modulo->nombre ?? '';
            $submoduloNombre = null;
            if (!empty($modulo->idpadre)) {
                $padre = \App\Models\Modulo::find($modulo->idpadre);
                if ($padre) {
                    $submoduloNombre = $moduloNombre;
                    $moduloNombre = $padre->nombre;
                }
            }

            // Buscar correo para Reply-To (primer valor que sea email válido)
            $correoRemitente = null;
            $nombreRemitente = null;
            foreach ($camposData as $clave => $valor) {
                if (!$correoRemitente && is_string($valor) && filter_var($valor, FILTER_VALIDATE_EMAIL)) {
                    $correoRemitente = $valor;
                    $nombreRemitente = $camposData[array_key_first($camposData)] ?? $valor;
                }
            }
            if ($correoRemitente) {
                $mail->addReplyTo($correoRemitente, $nombreRemitente);
            }

            // Contenido
            $mail->isHTML(true);
            $mail->Subject = 'Nuevo Ticket de Soporte ' . $ticket->numero_ticket;

            // Encabezado: número de ticket
            $mensaje = "<b>Número de Ticket:</b> " . htmlspecialchars($ticket->numero_ticket) . "<br>";

            // Módulo y submódulo
            $rutaModulo = htmlspecialchars($moduloNombre);
            if ($submoduloNombre) {
                $rutaModulo .= ' &rsaquo; ' . htmlspecialchars($submoduloNombre);
            }
            $mensaje .= "<b>Módulo:</b> " . $rutaModulo . "<br>";

            // Pregunta que originó el ticket
            if ($preguntaNombre) {
                $mensaje .= "<b>Pregunta:</b> " . htmlspecialchars($preguntaNombre) . "<br>";
            }

            // Campos del formulario (excluir claves con prefijo _ y campos de archivo)
            $camposUsuario = array_filter($camposData, fn($k) => !str_starts_with($k, '_'), ARRAY_FILTER_USE_KEY);
            if (!empty($camposUsuario)) {
                $mensaje .= "<br><b style='color: #4285f4;'>Información del Ticket:</b><br>";
                foreach ($camposUsuario as $clave => $valor) {
                    if ($valor === null || $valor === '') continue;
                    $label = $etiquetas[$clave] ?? ucwords(str_replace('_', ' ', $clave));
                    if (is_bool($valor)) {
                        $valor = $valor ? 'Sí' : 'No';
                    } elseif (is_array($valor)) {
                        $valor = implode(', ', $valor);
                    }
                    // Omitir campos de archivo (se mostrarán como imagen inline)
                    $esArchivo = is_string($valor) && preg_match('/\.(png|jpg|jpeg|gif|webp|bmp)$/i', $valor);
                    if ($esArchivo) continue;
                    $mensaje .= "<b>" . htmlspecialchars($label) . ":</b> " . htmlspecialchars((string) $valor) . "<br>";
                }
            }

            // Imágenes de campos file (inline) y otros archivos (adjunto)
            $extensionesImagen = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
            foreach ($archivosCustom as $nombreCampo => $archivoFile) {
                if (!$archivoFile || !$archivoFile->isValid()) continue;
                $ext = strtolower($archivoFile->getClientOriginalExtension());
                $label = $etiquetas[$nombreCampo] ?? ucwords(str_replace('_', ' ', $nombreCampo));
                if (in_array($ext, $extensionesImagen)) {
                    $cid = 'img_campo_' . preg_replace('/[^a-z0-9]/i', '_', $nombreCampo);
                    $mail->addEmbeddedImage($archivoFile->getRealPath(), $cid, $archivoFile->getClientOriginalName());
                    $mensaje .= "<br><b>" . htmlspecialchars($label) . ":</b><br>";
                    $mensaje .= '<img src="cid:' . $cid . '" style="max-width:100%; border:1px solid #ddd; border-radius:4px; margin-top:6px;"><br>';
                } else {
                    // Archivo no-imagen: adjuntar y mencionar en el cuerpo
                    $mail->addAttachment($archivoFile->getRealPath(), $archivoFile->getClientOriginalName());
                    $mensaje .= "<br><b>" . htmlspecialchars($label) . ":</b> 📎 " . htmlspecialchars($archivoFile->getClientOriginalName()) . " <i>(ver adjunto)</i><br>";
                }
            }

            // Screenshot (inline al final)
            if ($screenshotFile && $screenshotFile->isValid()) {
                $cidScreen = 'screenshot_ticket';
                $mail->addEmbeddedImage($screenshotFile->getRealPath(), $cidScreen, $screenshotFile->getClientOriginalName());
                $mensaje .= "<br><b>Captura de pantalla:</b><br>";
                $mensaje .= '<img src="cid:' . $cidScreen . '" style="max-width:100%; border:1px solid #ddd; border-radius:4px; margin-top:6px;"><br>';
            }

            // Fecha en zona horaria Colombia
            $fechaColombia = $ticket->created_at->setTimezone('America/Bogota');
            $mensaje .= "<br><b>Fecha:</b> " . $fechaColombia->format('d/m/Y H:i:s') . " (hora Colombia)";

            // Plantilla del mensaje
            $message = '
                <div style="font-family: system-ui, sans-serif, Arial; font-size: 14px; color: #333; padding: 20px 14px; background-color: #f5f5f5;">
                    <div style="max-width: 600px; margin: auto; background-color: #fff">
                        <div style="text-align: center; background-color: #333; padding: 14px">
                            <a style="text-decoration: none; outline: none" href="https://www.idartes.gov.co/" target="_blank">
                                <img style="height: 50px; vertical-align: middle" height="50px" 
                                src="https://lh5.googleusercontent.com/proxy/-54ZDkIc6o6bwuaDiXrpc0KvzR7IwhPTC_YANHEmzfOQr7yGtBnydGDL9g32IHZLinOLA9-aH09ArnO4We6jKnaP9arQfOG0cqmF2emrjCJWHDmMpR0Io5Z5yYcrpIi2lieY9Q" 
                                alt="IDARTES Logo" />
                            </a>
                        </div>
                        <div style="padding: 20px">
                            <h1 style="font-size: 22px; margin-bottom: 26px; color: #333;">Nuevo Ticket de Soporte</h1>
                            <p>Se ha generado un nuevo ticket desde la plataforma de preguntas frecuentes.</p>
                            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                ' . $mensaje . '
                            </div>
                            <p style="margin-top: 20px;">Atentamente,<br />Sistema FAQ IDARTES</p>
                        </div>
                    </div>
                    <div style="max-width: 600px; margin: auto; padding: 10px;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            Plataforma de Preguntas Frecuentes IDARTES
                        </p>
                    </div>
                </div>
            ';
            
            $mail->Body = $message;

            $mail->send();
            
        } catch (Exception $e) {
            \Log::error('Error al enviar correo de ticket: ' . $mail->ErrorInfo);
        }
    }

    /**
     * Listar todos los tickets (solo admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Ticket::with('modulo');

        // Filtrar por módulo si se especifica
        if ($request->has('modulo_id')) {
            $query->where('modulo_id', $request->modulo_id);
        }

        // Filtrar por estado si se especifica
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        $tickets = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'tickets' => $tickets
        ]);
    }

    /**
     * Ver un ticket específico
     */
    public function show($id): JsonResponse
    {
        $ticket = Ticket::with('modulo')->find($id);

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'ticket' => $ticket
        ]);
    }

    /**
     * Actualizar estado del ticket (solo admin)
     */
    public function updateEstado(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'estado' => 'required|in:pendiente,en_proceso,resuelto,cerrado',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $ticket = Ticket::find($id);

        if (!$ticket) {
            return response()->json([
                'success' => false,
                'message' => 'Ticket no encontrado'
            ], 404);
        }

        $ticket->estado = $request->estado;
        $ticket->save();

        return response()->json([
            'success' => true,
            'message' => 'Estado del ticket actualizado',
            'ticket' => $ticket
        ]);
    }
}
