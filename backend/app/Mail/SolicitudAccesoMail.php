<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class SolicitudAccesoMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array  $datosUsuario   Datos personales del solicitante
     * @param  string $plataformaNombre  Nombre legible de la plataforma (ej. "PANDORA")
     * @param  array  $plataformaData   Campos específicos de esa plataforma
     * @param  string|null $firmaPath  Ruta en storage public del archivo de firma (ORFEO / CONTRATACIÓN)
     */
    public function __construct(
        public readonly array   $datosUsuario,
        public readonly string  $plataformaNombre,
        public readonly array   $plataformaData,
        public readonly ?string $firmaPath = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Solicitud de Acceso - ' . $this->plataformaNombre . ' - ' . $this->datosUsuario['nombre_completo'],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.solicitud-acceso',
        );
    }

    public function attachments(): array
    {
        if ($this->firmaPath && Storage::disk('public')->exists($this->firmaPath)) {
            $absolutePath = Storage::disk('public')->path($this->firmaPath);
            return [
                Attachment::fromPath($absolutePath)
                    ->as('firma_' . $this->plataformaNombre . '.' . pathinfo($absolutePath, PATHINFO_EXTENSION))
                    ->withMime(mime_content_type($absolutePath) ?: 'application/octet-stream'),
            ];
        }

        return [];
    }
}
