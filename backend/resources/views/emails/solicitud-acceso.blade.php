<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitud de Acceso - {{ $plataformaNombre }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
            color: #333333;
        }
        .container {
            max-width: 620px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #dddddd;
        }
        .header {
            background-color: #1a3a5c;
            color: #ffffff;
            padding: 24px 32px;
        }
        .header h1 {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 13px;
            opacity: 0.85;
        }
        .platform-badge {
            background-color: #e8f0fe;
            border-left: 5px solid #1a73e8;
            margin: 24px 32px 0 32px;
            padding: 16px 20px;
            border-radius: 4px;
        }
        .platform-badge .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #555555;
            margin: 0 0 4px 0;
        }
        .platform-badge .name {
            font-size: 22px;
            font-weight: 700;
            color: #1a3a5c;
            margin: 0;
        }
        .section {
            padding: 24px 32px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #888888;
            margin: 0 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #eeeeee;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
        }
        table.data-table tr td {
            padding: 9px 0;
            vertical-align: top;
            border-bottom: 1px solid #f2f2f2;
            font-size: 14px;
            line-height: 1.5;
        }
        table.data-table tr:last-child td {
            border-bottom: none;
        }
        table.data-table td.field-label {
            width: 42%;
            color: #777777;
            padding-right: 12px;
        }
        table.data-table td.field-value {
            font-weight: 600;
            color: #222222;
        }
        .divider {
            border: none;
            border-top: 1px solid #eeeeee;
            margin: 0 32px;
        }
        .footer {
            padding: 20px 32px;
            font-size: 12px;
            color: #aaaaaa;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">

        <!-- Encabezado -->
        <div class="header">
            <h1>Nueva Solicitud de Acceso</h1>
            <p>Sistema de Gestión de Accesos — IDARTES</p>
        </div>

        <!-- Badge de plataforma -->
        <div class="platform-badge">
            <p class="label">Plataforma solicitada</p>
            <p class="name">{{ $plataformaNombre }}</p>
        </div>

        <!-- Datos del solicitante -->
        <div class="section">
            <p class="section-title">Datos del Solicitante</p>
            <table class="data-table">
                <tr>
                    <td class="field-label">Nombre completo</td>
                    <td class="field-value">{{ $datosUsuario['nombre_completo'] }}</td>
                </tr>
                <tr>
                    <td class="field-label">Tipo de documento</td>
                    <td class="field-value">{{ $datosUsuario['tipo_documento'] }}</td>
                </tr>
                <tr>
                    <td class="field-label">Número de documento</td>
                    <td class="field-value">{{ $datosUsuario['numero_documento'] }}</td>
                </tr>
                <tr>
                    <td class="field-label">Usuario de red</td>
                    <td class="field-value">{{ $datosUsuario['usuario_red'] }}</td>
                </tr>
                <tr>
                    <td class="field-label">Correo electrónico</td>
                    <td class="field-value">{{ $datosUsuario['correo'] }}</td>
                </tr>
                <tr>
                    <td class="field-label">Dependencia</td>
                    <td class="field-value">{{ $datosUsuario['dependencia'] }}</td>
                </tr>
                <tr>
                    <td class="field-label">Tipo de cargo</td>
                    <td class="field-value">{{ ucfirst($datosUsuario['cargo_tipo']) }}</td>
                </tr>
                @if (!empty($datosUsuario['cargo_nombre']))
                <tr>
                    <td class="field-label">Nombre del cargo</td>
                    <td class="field-value">{{ $datosUsuario['cargo_nombre'] }}</td>
                </tr>
                @endif
            </table>
        </div>

        {{-- Campos específicos de la plataforma (si los hay) --}}
        @if (!empty($plataformaData))
        <hr class="divider">
        <div class="section">
            <p class="section-title">Detalles del Acceso Solicitado</p>
            <table class="data-table">
                @foreach ($plataformaData as $campo => $valor)
                    @php
                        $labels = [
                            'programa_sfa'  => 'Programa SFA',
                            'rol_desempena' => 'Rol que desempeña',
                            'rol_acceso'    => 'Rol de acceso',
                            'modulo'        => 'Módulo',
                            'rol'           => 'Rol',
                        ];
                        $label = $labels[$campo] ?? ucwords(str_replace('_', ' ', $campo));
                    @endphp
                    @if ($campo !== 'firma_path' && !empty($valor))
                    <tr>
                        <td class="field-label">{{ $label }}</td>
                        <td class="field-value">{{ $valor }}</td>
                    </tr>
                    @endif
                @endforeach
                @if (!empty($plataformaData['firma_path']))
                <tr>
                    <td class="field-label">Firma digital</td>
                    <td class="field-value">Adjunta en este correo</td>
                </tr>
                @endif
            </table>
        </div>
        @endif

        <!-- Pie de página -->
        <div class="footer">
            <p>Este correo fue generado automáticamente por el sistema FAQ 2.0 — IDARTES.<br>
            Por favor no responda a este mensaje.</p>
        </div>

    </div>
</body>
</html>
