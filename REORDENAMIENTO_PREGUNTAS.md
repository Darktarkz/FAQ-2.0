# Funcionalidad de Reordenamiento de Preguntas

## 📋 Descripción

Esta funcionalidad permite a los usuarios administradores y con permisos reordenar las preguntas mediante **drag and drop** (arrastrar y soltar). El sistema actualiza automáticamente el orden de todas las preguntas afectadas.

## 🎯 Ejemplo de Uso

Si tienes estas preguntas en este orden:

- Pregunta 1
- Pregunta 2
- Pregunta 3
- Pregunta 4
- **Pregunta 5** (la que quieres mover)

Y arrastras la **Pregunta 5** a la posición 2, el resultado será:

- Pregunta 1
- **Pregunta 5** (nueva posición)
- Pregunta 2 (ahora es 3)
- Pregunta 3 (ahora es 4)
- Pregunta 4 (ahora es 5)

## 🚀 Cambios Implementados

### Backend (Laravel/PHP)

1. **Migración de Base de Datos**
   - Archivo: `backend/database/migrations/2026_02_09_000001_add_orden_to_preguntas_table.php`
   - Agrega el campo `orden` (integer) a la tabla `preguntas`
   - Incluye índice para mejorar el rendimiento

2. **Modelo Pregunta**
   - Actualizado para incluir `orden` en el array `fillable`

3. **Controlador PreguntaController**
   - Método `index()`: Ahora ordena por el campo `orden` en lugar de ID
   - Método `store()`: Asigna automáticamente el siguiente orden disponible al crear
   - Método `reordenar()`: **NUEVO** - Endpoint para actualizar el orden de múltiples preguntas

4. **Rutas API**
   - Nueva ruta protegida: `PUT /api/preguntas/reordenar/batch`
   - Requiere autenticación y permisos de administrador

### Frontend (Angular)

1. **Servicio de Preguntas**
   - Interfaz `Pregunta` actualizada con campos `orden`, `ID`
   - Método `reordenarPreguntas()`: **NUEVO** - Envía el nuevo orden al backend

2. **Componente de Preguntas**
   - Botón "Reordenar" visible solo para admins
   - Modo de reordenamiento activable/desactivable
   - Eventos de drag and drop implementados con HTML5 nativo
   - Reordenamiento visual en tiempo real
   - Guardado del nuevo orden al backend

3. **Estilos CSS**
   - Estilos para el modo drag and drop
   - Indicadores visuales de arrastre
   - Animaciones smooth para mejor UX

## 🔧 Instalación y Configuración

### 1. Ejecutar Migración

```bash
cd backend
php artisan migrate --path=database/migrations/2026_02_09_000001_add_orden_to_preguntas_table.php
```

### 2. Inicializar Valores de Orden (solo primera vez)

```bash
php artisan tinker --execute="DB::statement('UPDATE preguntas SET orden = ID WHERE orden = 0');"
```

O puedes ejecutar este SQL directamente en tu base de datos:

```sql
UPDATE preguntas SET orden = ID WHERE orden = 0;
```

### 3. No se requieren cambios adicionales en el frontend

Los archivos ya están actualizados y listos para usar.

## 👤 Permisos y Acceso

### ¿Quién puede reordenar preguntas?

- **Administradores** (usuarios con `is_admin = 1`)
- **Usuarios con permisos** sobre el módulo correspondiente

### Verificación de Permisos

El sistema verifica automáticamente:

1. Si el usuario está autenticado
2. Si tiene permisos sobre el módulo de las preguntas
3. Solo permite reordenar preguntas del mismo módulo

## 📱 Cómo Usar la Funcionalidad

1. **Iniciar sesión** como administrador o usuario con permisos

2. **Navegar** hasta una lista de preguntas de un módulo específico

3. **Hacer clic** en el botón **"↕️ Reordenar"**
   - El botón solo es visible para usuarios con permisos
   - Las preguntas dejan de expandirse
   - Aparece el icono "⋮⋮" para arrastrar

4. **Arrastrar y soltar** las preguntas en el orden deseado
   - Haz clic y mantén presionado sobre una pregunta
   - Arrastra hasta la posición deseada
   - Suelta el botón del mouse

5. **Guardar** haciendo clic en **"✓ Guardar Orden"**
   - El sistema guarda el nuevo orden
   - Las preguntas se recargan con el orden actualizado
   - El modo reordenamiento se desactiva

## 🔄 Flujo de Reordenamiento

```
Usuario hace clic en "Reordenar"
    ↓
Se activa el modo drag & drop
    ↓
Usuario arrastra pregunta a nueva posición
    ↓
Reordenamiento visual en tiempo real
    ↓
Usuario hace clic en "Guardar Orden"
    ↓
Frontend envía array con nuevo orden al backend
    ↓
Backend valida permisos
    ↓
Backend actualiza campo "orden" de cada pregunta
    ↓
Frontend recarga las preguntas con nuevo orden
    ↓
Confirmación de éxito
```

## 🛠️ API Endpoints

### Reordenar Preguntas

**Endpoint:** `PUT /api/preguntas/reordenar/batch`

**Autenticación:** Requerida (Bearer Token)

**Permisos:** Admin o permisos sobre el módulo

**Request Body:**

```json
{
  "preguntas": [
    {
      "id": 5,
      "orden": 1
    },
    {
      "id": 1,
      "orden": 2
    },
    {
      "id": 2,
      "orden": 3
    }
  ]
}
```

**Response (Éxito - 200):**

```json
{
  "success": true,
  "message": "Preguntas reordenadas exitosamente",
  "total_actualizadas": 3
}
```

**Response (Error - 403):**

```json
{
  "message": "No tienes permisos para gestionar preguntas en este módulo"
}
```

**Response (Error - 500):**

```json
{
  "success": false,
  "message": "Error al reordenar preguntas: [detalle del error]"
}
```

## 🐛 Solución de Problemas

### Las preguntas no se reordenan

- Verifica que tengas permisos de administrador
- Revisa la consola del navegador para errores
- Asegúrate de estar en modo reordenamiento

### El orden no se guarda

- Verifica tu conexión al backend
- Comprueba que el token de autenticación sea válido
- Revisa los logs del servidor en `backend/storage/logs`

### Error al ejecutar la migración

Si obtienes un error de tabla duplicada:

```bash
php artisan migrate:rollback --step=1
php artisan migrate --path=database/migrations/2026_02_09_000001_add_orden_to_preguntas_table.php
```

## 📊 Estructura de Base de Datos

### Tabla: `preguntas`

| Campo      | Tipo    | Descripción                       |
| ---------- | ------- | --------------------------------- |
| ID         | INT     | Primary Key                       |
| Idmodulo   | INT     | Foreign Key a módulos             |
| **orden**  | **INT** | **Nuevo campo para ordenamiento** |
| Pregunta   | TEXT    | Texto de la pregunta              |
| Respuesta  | TEXT    | Texto de la respuesta             |
| Aplicativo | TEXT    | Aplicativo relacionado            |
| Modulo     | TEXT    | Nombre del módulo                 |
| Submodulo  | TEXT    | Nombre del submódulo              |

**Índice:** Existe un índice en el campo `orden` para mejorar el rendimiento de las consultas.

## 🎨 Características Visuales

- **Cursor de arrastre**: El cursor cambia a "move" en modo reordenamiento
- **Feedback visual**: La pregunta arrastrada se muestra semi-transparente
- **Hover effects**: Indicador visual cuando pasas sobre una posición válida
- **Animaciones**: Transiciones suaves al soltar las preguntas
- **Handle de drag**: Icono "⋮⋮" visible solo en modo reordenamiento

## 📝 Notas Técnicas

- Usa **HTML5 Drag and Drop API** nativo (no requiere librerías adicionales)
- **Transacciones de BD**: El reordenamiento se hace en una transacción para evitar inconsistencias
- **Validación de permisos**: Se verifica en backend para cada pregunta
- **Orden optimista**: El frontend muestra el cambio inmediatamente y revierte si hay error
- **Cache busting**: Las preguntas se recargan del servidor después de guardar

## 🔐 Seguridad

- ✅ Autenticación requerida via Laravel Sanctum
- ✅ Validación de permisos por módulo
- ✅ Protección CSRF incluida
- ✅ Sanitización de inputs
- ✅ Transacciones de base de datos para integridad

## 📄 Archivos Modificados/Creados

### Backend

- ✅ `backend/database/migrations/2026_02_09_000001_add_orden_to_preguntas_table.php` (nuevo)
- ✅ `backend/app/Models/Pregunta.php` (modificado)
- ✅ `backend/app/Http/Controllers/PreguntaController.php` (modificado)
- ✅ `backend/routes/api.php` (modificado)

### Frontend

- ✅ `frontend/src/app/services/pregunta.service.ts` (modificado)
- ✅ `frontend/src/app/components/preguntas/preguntas.component.ts` (modificado)
- ✅ `frontend/src/app/components/preguntas/preguntas.component.html` (modificado)
- ✅ `frontend/src/app/components/preguntas/preguntas.component.css` (modificado)

---

## 🎉 ¡Listo!

La funcionalidad de reordenamiento está completamente implementada y lista para usar. Los usuarios administradores ahora pueden organizar las preguntas en el orden que deseen con una interfaz intuitiva de arrastrar y soltar.
