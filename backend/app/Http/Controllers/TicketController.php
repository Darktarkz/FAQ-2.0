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
        $validator = Validator::make($request->all(), [
            'modulo_id' => 'required|exists:modulos,id',
            'campos_personalizados' => 'required|json',
            'screenshot' => 'nullable|image|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
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
            $camposPersonalizados = json_decode($request->campos_personalizados, true);

            // Crear ticket
            $ticket = Ticket::create([
                'numero_ticket' => $numeroTicket,
                'modulo_id' => $request->modulo_id,
                'campos_personalizados' => $camposPersonalizados,
                'screenshot_path' => $screenshotPath,
            ]);

            // Cargar relación del módulo
            $ticket->load('modulo');

            // Enviar correo de notificación
            $this->enviarCorreoSoporte($ticket, $request->file('screenshot'));

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
    private function enviarCorreoSoporte(Ticket $ticket, $screenshotFile = null)
    {
        $config = require base_path('../mail.php');
        
        $mail = new PHPMailer(true);

        try {
            // Configuración del servidor
            $mail->isSMTP();
            $mail->Host = $config['smtp_host'];
            $mail->SMTPAuth = true;
            $mail->Username = $config['smtp_user'];
            $mail->Password = $config['smtp_pass'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $config['smtp_port'];
            $mail->CharSet = 'UTF-8';

            // Remitente y destinatario
            $mail->setFrom($config['from_email'], $config['from_name']);
            $mail->addAddress('jineth.moreno@idartes.gov.co');
            $mail->addCC('soporte.ti@idartes.gov.co');
            $mail->addReplyTo($ticket->correo, $ticket->nombre_completo);

            // Contenido
            $mail->isHTML(true);
            $mail->Subject = 'Nuevo Ticket de Soporte ' . $ticket->numero_ticket;
            
            // Construir mensaje con todos los datos del ticket
            $mensaje = '';
            $campos = [
                'Número de Ticket' => $ticket->numero_ticket,
                'Módulo' => $ticket->modulo->nombre,
            ];

            foreach ($campos as $nombre => $valor) {
                if (!empty($valor)) {
                    $mensaje .= "<b>" . htmlspecialchars($nombre) . ":</b> " . htmlspecialchars($valor) . "<br>";
                }
            }

            // Agregar campos personalizados si existen
            if ($ticket->campos_personalizados && is_array($ticket->campos_personalizados)) {
                $mensaje .= "<br><b style='color: #4285f4;'>Información del Ticket:</b><br>";
                foreach ($ticket->campos_personalizados as $nombreCampo => $valor) {
                    if (!empty($valor)) {
                        // Formatear el nombre del campo (snake_case a Title Case)
                        $nombreFormateado = ucwords(str_replace('_', ' ', $nombreCampo));
                        
                        // Si el valor es booleano, convertir a Sí/No
                        if (is_bool($valor)) {
                            $valor = $valor ? 'Sí' : 'No';
                        }
                        
                        $mensaje .= "<b>" . htmlspecialchars($nombreFormateado) . ":</b> " . htmlspecialchars($valor) . "<br>";
                    }
                }
            }

            $mensaje .= "<br><b>Fecha:</b> " . $ticket->created_at->format('d/m/Y H:i:s');

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

            // Adjuntar screenshot si existe
            if ($screenshotFile && $screenshotFile->isValid()) {
                $mail->addAttachment(
                    $screenshotFile->getRealPath(),
                    $screenshotFile->getClientOriginalName()
                );
            }

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
