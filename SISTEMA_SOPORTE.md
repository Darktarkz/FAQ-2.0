# Sistema de Soporte - Tickets por Módulo

## 📋 Descripción

Sistema integrado de tickets de soporte que permite a los usuarios reportar problemas específicos por cada módulo del sistema FAQ. Cada ticket se envía automáticamente por correo electrónico al equipo de soporte de IDARTES.

## ✨ Características

- ✅ Formulario específico por módulo
- ✅ Captura de pantalla opcional
- ✅ Envío automático de correos usando PHPMailer
- ✅ Validación de campos
- ✅ Almacenamiento en base de datos
- ✅ Botón flotante de soporte
- ✅ Responsive design

## 🚀 Instalación

### 1. Backend (Laravel)

#### Ejecutar migración

```bash
cd backend
php artisan migrate
```

Esto creará la tabla `tickets` en la base de datos.

#### Instalar PHPMailer (si no está instalado)

```bash
composer require phpmailer/phpmailer
```

#### Configurar archivo de correo

El archivo `mail.php` en la raíz del proyecto ya contiene la configuración:

```php
return [
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 587,
    'smtp_user' => 'notificacionesaplicaciones@idartes.gov.co',
    'smtp_pass' => 'roep qcyb ivyy osji',
    'smtp_secure' => 'tls',
    'from_email' => 'notificacionesaplicaciones@idartes.gov.co',
    'from_name' => 'Sistema de Tickets IDARTES'
];
```

### 2. Frontend (Angular)

Ya están creados todos los componentes necesarios:

- `ticket.service.ts` - Servicio para manejar tickets
- `formulario-soporte` - Formulario completo de soporte
- `boton-soporte` - Botón reutilizable
- `pagina-soporte` - Página contenedora del formulario

## 📖 Uso

### Opción 1: Botón Flotante (Recomendado)

Agrega el botón flotante en cualquier componente de módulo:

```typescript
// En tu componente TypeScript
import { BotonSoporteComponent } from "./components/boton-soporte/boton-soporte.component";

@Component({
  selector: "app-mi-modulo",
  standalone: true,
  imports: [CommonModule, BotonSoporteComponent],
  // ...
})
export class MiModuloComponent {
  moduloId = 5; // ID del módulo actual
  moduloNombre = "Inicio de Sesión Pandora";
}
```

```html
<!-- En tu template HTML -->
<div class="contenido-modulo">
  <!-- Tu contenido aquí -->
</div>

<!-- Botón flotante de soporte -->
<app-boton-soporte
  [moduloId]="moduloId"
  [moduloNombre]="moduloNombre"
  posicion="fixed"
>
</app-boton-soporte>
```

### Opción 2: Botón Integrado

```html
<!-- Botón integrado en el header o footer -->
<div class="header-modulo">
  <h1>{{ moduloNombre }}</h1>

  <app-boton-soporte
    [moduloId]="moduloId"
    [moduloNombre]="moduloNombre"
    posicion="static"
  >
  </app-boton-soporte>
</div>
```

### Opción 3: Formulario Directo

Si prefieres mostrar el formulario directamente en la página:

```html
<app-formulario-soporte [moduloId]="moduloId" [moduloNombre]="moduloNombre">
</app-formulario-soporte>
```

## 🛣️ Configurar Ruta en Angular

Agrega la ruta al archivo de rutas de Angular (`app.routes.ts` o similar):

```typescript
import { Routes } from "@angular/router";
import { PaginaSoporteComponent } from "./components/pagina-soporte/pagina-soporte.component";

export const routes: Routes = [
  // ... tus otras rutas
  {
    path: "soporte",
    component: PaginaSoporteComponent,
  },
];
```

## 📝 Campos del Formulario

### Campos Obligatorios

- Nombre completo
- Correo electrónico
- Descripción del problema

### Campos Opcionales

- Tipo de identificación
- Número de identificación
- Teléfono
- Número de contrato
- Captura de pantalla (máx. 5MB)

## 📧 Correo Enviado

Cada ticket genera un correo automático enviado a:

- **Principal**: jineth.moreno@idartes.gov.co
- **Copia**: soporte.ti@idartes.gov.co
- **Reply-To**: Correo del usuario que reportó

## 🗄️ Estructura de la Base de Datos

Tabla: `tickets`

```sql
- id (bigint, PK)
- numero_ticket (string, unique)
- modulo_id (foreign key -> modulos)
- nombre_completo (string)
- tipo_identificacion (string, nullable)
- cedula (string, nullable)
- correo (string)
- telefono (string, nullable)
- numero_contrato (string, nullable)
- descripcion (text)
- screenshot_path (string, nullable)
- estado (enum: pendiente, en_proceso, resuelto, cerrado)
- prioridad (enum: baja, media, alta)
- created_at (timestamp)
- updated_at (timestamp)
```

## 🔌 Endpoints API

### Público (sin autenticación)

- `POST /api/tickets` - Crear ticket

### Protegido (requiere autenticación admin)

- `GET /api/tickets` - Listar todos los tickets
- `GET /api/tickets/{id}` - Ver detalle de ticket
- `PUT /api/tickets/{id}/estado` - Actualizar estado

## 📱 Ejemplo de Implementación Real

### Ejemplo: Módulo de Pandora Login

```typescript
// pandora-login.component.ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BotonSoporteComponent } from "../boton-soporte/boton-soporte.component";

@Component({
  selector: "app-pandora-login",
  standalone: true,
  imports: [CommonModule, BotonSoporteComponent],
  template: `
    <div class="modulo-container">
      <header class="modulo-header">
        <h1>INICIO DE SESIÓN PANDORA</h1>
      </header>

      <div class="preguntas-frecuentes">
        <div class="pregunta" *ngFor="let pregunta of preguntas">
          <h3>{{ pregunta.texto }}</h3>
          <p [innerHTML]="pregunta.respuesta"></p>
        </div>
      </div>

      <!-- Botón flotante de soporte -->
      <app-boton-soporte
        [moduloId]="1"
        [moduloNombre]="'Inicio de Sesión Pandora'"
        posicion="fixed"
      >
      </app-boton-soporte>
    </div>
  `,
})
export class PandoraLoginComponent {
  preguntas = [
    {
      texto: "¿Cómo ingresar a Pandora?",
      respuesta: "Para ingresar...",
    },
    // ... más preguntas
  ];
}
```

## 🎨 Personalización

### Cambiar colores del botón

Edita `boton-soporte.component.css`:

```css
.boton-soporte {
  background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
}
```

### Cambiar destinatarios de correo

Edita `TicketController.php` líneas 105-107:

```php
$mail->addAddress('tu-email@ejemplo.com');
$mail->addCC('otro-email@ejemplo.com');
```

## 🔒 Seguridad

- ✅ Validación de campos en frontend y backend
- ✅ Tamaño máximo de archivo: 5MB
- ✅ Solo imágenes permitidas
- ✅ Protección contra inyección SQL (Eloquent ORM)
- ✅ Rutas de administración protegidas con autenticación

## 🐛 Troubleshooting

### El correo no se envía

1. Verifica las credenciales en `mail.php`
2. Revisa los logs de Laravel: `backend/storage/logs/laravel.log`
3. Asegúrate que PHPMailer esté instalado

### El archivo no se sube

1. Verifica permisos de la carpeta `backend/storage/app/public`
2. Ejecuta: `php artisan storage:link`
3. Verifica límites de PHP: `upload_max_filesize` y `post_max_size`

### Error 404 en la ruta `/soporte`

1. Verifica que la ruta esté agregada en `app.routes.ts`
2. Reinicia el servidor Angular: `ng serve`

## 📞 Contacto

Para dudas sobre el sistema de soporte, contactar a:
**Equipo TI IDARTES** - soporte.ti@idartes.gov.co

---

_Última actualización: 10 de febrero de 2026_
