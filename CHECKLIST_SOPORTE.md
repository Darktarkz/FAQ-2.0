# ✅ Checklist de Implementación - Sistema de Soporte

## Backend

- [x] ✅ Migración de tabla tickets creada
- [x] ✅ Modelo Ticket creado
- [x] ✅ TicketController creado con envío de correos
- [x] ✅ Rutas API configuradas
- [x] ✅ Archivo mail.php con credenciales SMTP
- [ ] ⚠️ **PENDIENTE:** Ejecutar migración: `php artisan migrate`
- [ ] ⚠️ **PENDIENTE:** Verificar PHPMailer instalado: `composer require phpmailer/phpmailer`
- [ ] ⚠️ **PENDIENTE:** Crear enlace simbólico storage: `php artisan storage:link`

## Frontend

- [x] ✅ Servicio TicketService creado
- [x] ✅ Componente FormularioSoporte creado
- [x] ✅ Componente BotonSoporte creado
- [x] ✅ Componente PaginaSoporte creado
- [ ] ⚠️ **PENDIENTE:** Agregar ruta `/soporte` en app.routes.ts
- [ ] ⚠️ **PENDIENTE:** Integrar botón en módulos específicos

## Pasos para Poner en Marcha

### 1. Backend - Ejecutar en Terminal

```bash
cd d:\Proyectos\faq2.0\backend

# 1. Ejecutar migración
php artisan migrate

# 2. Verificar PHPMailer (si falla el correo)
composer require phpmailer/phpmailer

# 3. Crear enlace simbólico para storage
php artisan storage:link

# 4. Verificar permisos (importante)
# Windows PowerShell:
icacls storage /grant Everyone:F /T
icacls bootstrap/cache /grant Everyone:F /T
```

### 2. Frontend - Configurar Rutas

Edita el archivo de rutas (app.routes.ts o app-routing.module.ts):

```typescript
import { PaginaSoporteComponent } from "./components/pagina-soporte/pagina-soporte.component";

export const routes: Routes = [
  // ... tus rutas existentes

  // AGREGAR ESTA RUTA:
  {
    path: "soporte",
    component: PaginaSoporteComponent,
  },
];
```

### 3. Integrar en Módulos

Ejemplo: Agregar botón en el componente de preguntas

```typescript
// En faq-preguntas.component.ts (o el componente que quieras)
import { BotonSoporteComponent } from '../boton-soporte/boton-soporte.component';

@Component({
  imports: [..., BotonSoporteComponent],
  template: `
    <!-- Tu contenido existente -->

    <!-- AGREGAR AL FINAL: -->
    <app-boton-soporte
      [moduloId]="moduloId"
      [moduloNombre]="moduloNombre"
      posicion="fixed">
    </app-boton-soporte>
  `
})
```

### 4. Reiniciar Servicios

```bash
# Backend (si está corriendo)
Ctrl+C (para detener)
php artisan serve

# Frontend
Ctrl+C (para detener)
ng serve
```

## Verificación

### ✅ Probar Backend

```bash
# Test de endpoint
curl -X POST http://127.0.0.1:8000/api/tickets \
  -F "modulo_id=1" \
  -F "nombre_completo=Test User" \
  -F "correo=test@example.com" \
  -F "descripcion=Problema de prueba"
```

### ✅ Probar Frontend

1. Navegar a cualquier módulo
2. Hacer clic en el botón "¿Necesitas ayuda?"
3. Llenar el formulario
4. Verificar que aparece mensaje de éxito
5. Revisar correo en jineth.moreno@idartes.gov.co

## Archivos Creados

### Backend

```
backend/
├── app/
│   ├── Http/Controllers/
│   │   └── TicketController.php ✅
│   └── Models/
│       └── Ticket.php ✅
├── database/migrations/
│   └── 2026_02_10_000000_create_tickets_table.php ✅
└── routes/
    └── api.php (modificado) ✅

Raíz del proyecto:
├── mail.php ✅
└── sendform.php ✅
```

### Frontend

```
frontend/src/app/
├── services/
│   └── ticket.service.ts ✅
└── components/
    ├── boton-soporte/
    │   ├── boton-soporte.component.ts ✅
    │   ├── boton-soporte.component.html ✅
    │   └── boton-soporte.component.css ✅
    ├── formulario-soporte/
    │   ├── formulario-soporte.component.ts ✅
    │   ├── formulario-soporte.component.html ✅
    │   └── formulario-soporte.component.css ✅
    └── pagina-soporte/
        ├── pagina-soporte.component.ts ✅
        ├── pagina-soporte.component.html ✅
        └── pagina-soporte.component.css ✅
```

### Documentación

```
SISTEMA_SOPORTE.md ✅
EJEMPLO_INTEGRACION_SOPORTE.ts ✅
```

## Configuración de Correo

El archivo `mail.php` ya está configurado con:

- Host: smtp.gmail.com
- Puerto: 587
- Usuario: notificacionesaplicaciones@idartes.gov.co
- Contraseña: [configurada]

Destinatarios automáticos:

- Principal: jineth.moreno@idartes.gov.co
- Copia: soporte.ti@idartes.gov.co

## Troubleshooting Rápido

### ❌ Error: "Class 'PHPMailer' not found"

```bash
cd backend
composer require phpmailer/phpmailer
```

### ❌ Error: "Storage link not found"

```bash
php artisan storage:link
```

### ❌ Error: "SQLSTATE[42S02]: Base table or view not found: 'tickets'"

```bash
php artisan migrate
```

### ❌ El correo no llega

1. Verificar credenciales en `mail.php`
2. Revisar logs: `backend/storage/logs/laravel.log`
3. Verificar que Gmail permite aplicaciones menos seguras

### ❌ Archivo screenshots no se guarda

```bash
# Windows PowerShell (como administrador):
icacls backend\storage /grant Everyone:F /T
```

## Próximos Pasos Opcionales

- [ ] Crear panel de admin para ver tickets
- [ ] Agregar notificaciones en tiempo real
- [ ] Implementar chat en vivo
- [ ] Agregar categorización automática de tickets
- [ ] Implementar respuestas automáticas
- [ ] Agregar métricas y reportes

## Contacto y Soporte

Para dudas sobre la implementación:

- Revisar `SISTEMA_SOPORTE.md` - Documentación completa
- Revisar `EJEMPLO_INTEGRACION_SOPORTE.ts` - Ejemplos de código

---

**Estado del Sistema:** ✅ Listo para implementar
**Última actualización:** 10 de febrero de 2026
