# 📋 Constructor de Formularios Dinámicos - Sistema FAQ IDARTES

## 🎯 Descripción General

El **Constructor de Formularios Dinámicos** es un módulo administrativo que permite a los usuarios administradores crear, editar y asignar formularios personalizados para cada módulo del sistema FAQ, sin necesidad de escribir código.

## ✨ Características Principales

### 1. Gestión de Formularios

- ✅ Crear formularios personalizados
- ✅ Editar formularios existentes
- ✅ Duplicar formularios
- ✅ Activar/Desactivar formularios
- ✅ Eliminar formularios
- ✅ Asignar formularios a múltiples módulos

### 2. Constructor Visual

- 🎨 Paleta de 10 tipos de campos diferentes
- 🖼️ Canvas drag-and-drop (simulado con clicks)
- 🔧 Panel de propiedades en tiempo real
- 👁️ Vista previa del formulario
- 📦 Sistema de grid (12 columnas)
- ⬆️⬇️ Reorganización de campos con flechas

### 3. Tipos de Campos Disponibles

1. **📝 Texto** - Campos de texto simple
2. **📧 Email** - Validación de correo electrónico
3. **📱 Teléfono** - Entrada de números telefónicos
4. **🔢 Número** - Solo valores numéricos
5. **📅 Fecha** - Selector de fechas
6. **📋 Selección** - Lista desplegable (select)
7. **📄 Área de Texto** - Textos largos (textarea)
8. **📎 Archivo** - Subida de archivos
9. **☑️ Checkbox** - Casillas de verificación
10. **🔘 Radio** - Opciones excluyentes

### 4. Propiedades Configurables

Cada campo puede tener:

- **Etiqueta**: Texto visible para el usuario
- **Nombre del campo**: Identificador único (sin espacios)
- **Placeholder**: Texto de ejemplo
- **Descripción de ayuda**: Ayuda contextual
- **Campo requerido**: Obligatorio/Opcional
- **Tamaño**: 12, 6, 4 o 3 columnas (ancho)
- **Orden**: Posición en el formulario
- **Opciones**: Para select y radio (una por línea)
- **Reglas de validación**: Regex, min, max, etc.

## 🏗️ Arquitectura del Sistema

### Backend (Laravel)

#### Estructura de Base de Datos

**Tabla: `formulario_templates`**

```sql
- id (PK)
- nombre VARCHAR(255)
- descripcion TEXT
- modulos_asignados JSON  -- Array de IDs de módulos
- activo BOOLEAN
- timestamps
```

**Tabla: `formulario_campos`**

```sql
- id (PK)
- formulario_template_id (FK)
- nombre_campo VARCHAR(100)
- etiqueta VARCHAR(255)
- tipo ENUM(text, email, tel, number, date, select, textarea, file, checkbox, radio)
- placeholder VARCHAR(255)
- descripcion_ayuda TEXT
- requerido BOOLEAN
- opciones JSON  -- Para select/radio
- validacion VARCHAR(255)
- orden INTEGER
- tamano_columna INTEGER (1-12)
- timestamps
```

#### Modelos Laravel

**FormularioTemplate.php**

```php
class FormularioTemplate extends Model
{
    protected $casts = [
        'modulos_asignados' => 'array',
        'activo' => 'boolean'
    ];

    public function campos() {
        return $this->hasMany(FormularioCampo::class);
    }

    public static function porModulo($moduloId) {
        return self::where('activo', true)
            ->whereJsonContains('modulos_asignados', $moduloId)
            ->with('campos')
            ->first();
    }
}
```

**FormularioCampo.php**

```php
class FormularioCampo extends Model
{
    protected $casts = [
        'requerido' => 'boolean',
        'opciones' => 'array'
    ];

    public function template() {
        return $this->belongsTo(FormularioTemplate::class, 'formulario_template_id');
    }
}
```

#### Controlador API

**FormularioTemplateController.php**

Métodos disponibles:

- `index()` - Listar todos los formularios (ADMIN)
- `show($id)` - Ver un formulario específico (ADMIN)
- `porModulo($moduloId)` - Obtener formulario por módulo (PÚBLICO)
- `store(Request $request)` - Crear formulario (ADMIN)
- `update(Request $request, $id)` - Actualizar formulario (ADMIN)
- `destroy($id)` - Eliminar formulario (ADMIN)
- `duplicate($id)` - Duplicar formulario (ADMIN)

#### Rutas API

```php
// Rutas públicas
GET /api/formularios/modulo/{moduloId}

// Rutas protegidas (auth:sanctum)
GET    /api/formularios
POST   /api/formularios
GET    /api/formularios/{id}
PUT    /api/formularios/{id}
DELETE /api/formularios/{id}
POST   /api/formularios/{id}/duplicate
```

### Frontend (Angular)

#### Servicios

**FormularioTemplateService**

- `getAll()` - Obtener todos los formularios
- `getById(id)` - Obtener formulario por ID
- `getPorModulo(moduloId)` - Obtener formulario asignado a un módulo
- `create(formulario)` - Crear formulario
- `update(id, formulario)` - Actualizar formulario
- `delete(id)` - Eliminar formulario
- `duplicate(id)` - Duplicar formulario
- `validarFormulario(formulario)` - Validar estructura
- `crearCampoVacio(orden)` - Helper para nuevo campo
- `getIconoPorTipo(tipo)` - Obtener emoji del tipo
- `getNombreTipo(tipo)` - Obtener nombre legible

#### Componentes

**1. ListaFormulariosComponent**

- **Ruta**: `/admin/formularios`
- **Función**: Vista de tabla con todos los formularios
- **Acciones**: Ver, Editar, Duplicar, Eliminar, Activar/Desactivar

**2. ConstructorFormularioComponent**

- **Rutas**:
  - `/admin/formularios/nuevo` - Crear
  - `/admin/formularios/editar/:id` - Editar
  - `/admin/formularios/ver/:id` - Ver (modo lectura)
- **Función**: Constructor visual drag-and-drop
- **Secciones**:
  - Panel Izquierdo: Paleta de campos + Configuración general
  - Panel Central: Canvas del formulario
  - Panel Derecho: Propiedades del campo seleccionado
  - Header: Botones Cancelar, Vista Previa, Guardar

**3. FormularioSoporteComponent (Actualizado)**

- **Función**: Renderiza formularios dinámicos o estáticos
- **Lógica**:
  1. Al inicializar, intenta obtener formulario dinámico para el módulo
  2. Si existe, usa `usarFormularioDinamico = true`
  3. Si no existe, usa el formulario estático predeterminado
  4. Renderiza campos dinámicamente según la configuración

## 🚀 Flujo de Uso

### Para el Administrador

1. **Acceder al Constructor**
   - Login como admin
   - Ir a /admin/formularios
   - Click en "Crear Nuevo Formulario"

2. **Crear Formulario**
   - Ingresar nombre y descripción
   - Añadir campos desde la paleta (click en el tipo de campo)
   - Click en cada campo para configurar propiedades
   - Usar flechas ⬆️⬇️ para reordenar
   - Vista previa para validar aspecto

3. **Configurar Campos**
   - Etiqueta: "Nombre Completo"
   - Nombre campo: "nombre_completo"
   - Tipo: text
   - Requerido: ☑️
   - Placeholder: "Ingrese su nombre..."
   - Tamaño: 12 (ancho completo)

4. **Asignar a Módulos**
   - Seleccionar módulos desde dropdown
   - Agregar múltiples módulos
   - Activar formulario

5. **Guardar y Probar**
   - Click en "Guardar"
   - Ir al módulo asignado
   - Verificar que el formulario personalizado aparece

### Para el Usuario Final

1. **Acceder al Módulo FAQ**
   - Navegar a un módulo
   - Expandir una pregunta
   - Click en "Reportar Error"

2. **Completar Formulario Dinámico**
   - Ver campos personalizados para ese módulo
   - Completar campos requeridos (marcados con \*)
   - Adjuntar archivos si aplica
   - Enviar ticket

3. **Confirmación**
   - Recibir número de ticket
   - Email de confirmación
   - Soporte recibe el ticket con los datos del formulario personalizado

## 📝 Ejemplo de Estructura JSON

### Formulario Template

```json
{
  "id": 1,
  "nombre": "Formulario Soporte Técnico Especializado",
  "descripcion": "Para reportar errores del módulo de contratos",
  "modulos_asignados": [5, 8, 12],
  "activo": true,
  "campos": [
    {
      "nombre_campo": "nombre_completo",
      "etiqueta": "Nombre Completo",
      "tipo": "text",
      "placeholder": "Juan Pérez",
      "requerido": true,
      "orden": 0,
      "tamano_columna": 6
    },
    {
      "nombre_campo": "email",
      "etiqueta": "Correo Electrónico",
      "tipo": "email",
      "requerido": true,
      "orden": 1,
      "tamano_columna": 6
    },
    {
      "nombre_campo": "tipo_contrato",
      "etiqueta": "Tipo de Contrato",
      "tipo": "select",
      "opciones": ["Prestación de Servicios", "Obra", "Suministro"],
      "requerido": true,
      "orden": 2,
      "tamano_columna": 12
    },
    {
      "nombre_campo": "descripcion_error",
      "etiqueta": "Descripción del Error",
      "tipo": "textarea",
      "descripcion_ayuda": "Describa detalladamente el problema encontrado",
      "requerido": true,
      "orden": 3,
      "tamano_columna": 12
    },
    {
      "nombre_campo": "screenshot",
      "etiqueta": "Captura de Pantalla",
      "tipo": "file",
      "descripcion_ayuda": "Adjunte una imagen del error (máx 5MB)",
      "requerido": false,
      "orden": 4,
      "tamano_columna": 12
    }
  ],
  "created_at": "2026-02-10T10:30:00",
  "updated_at": "2026-02-10T10:30:00"
}
```

## 🔒 Seguridad y Validación

### Backend

- ✅ Rutas protegidas con middleware auth:sanctum
- ✅ Validación de campos requeridos
- ✅ Validación de tipos de datos (enum para tipos de campo)
- ✅ Sanitización de inputs
- ✅ Límite de tamaño de archivos (5MB)
- ✅ Validación de formato de JSON

### Frontend

- ✅ Guards para rutas admin (AdminGuard)
- ✅ Validación de campos requeridos antes de enviar
- ✅ Validación de email con regex
- ✅ Validación de tipos de archivo
- ✅ Feedback visual de errores
- ✅ Estados de loading durante operaciones

## 🎨 UX/UI Highlights

### Constructor Visual

- **Paleta Intuitiva**: Iconos emoji para cada tipo de campo
- **Canvas Interactivo**: Click para seleccionar, botones para acciones
- **Propiedades en Tiempo Real**: Cambios reflejados inmediatamente
- **Vista Previa**: Ver exactamente cómo se verá antes de guardar
- **Responsive**: Funciona en desktop y tablet

### Formulario Dinámico

- **Adaptativo**: Se ajusta al tamaño de pantalla
- **Consistente**: Mismo estilo que el resto de la aplicación
- **Ayuda Contextual**: Tooltips y textos de ayuda
- **Feedback Visual**: Campos requeridos marcados con \*
- **Preview de Imágenes**: Ver archivos antes de enviar

## 🐛 Manejo de Errores

### Casos Cubiertos

1. **Sin Formulario Asignado**
   - Comportamiento: Usa formulario estático por defecto
   - Usuario: No nota diferencia

2. **Error de Conexión**
   - Comportamiento: Muestra mensaje, vuelve a formulario estático
   - Usuario: Puede completar ticket de todas formas

3. **Validación Fallida**
   - Comportamiento: Lista de campos faltantes
   - Usuario: Recibe feedback específico

4. **Duplicación de Nombre de Campo**
   - Comportamiento: Validación en backend
   - Usuario: Error descriptivo

5. **Formulario Sin Campos**
   - Comportamiento: No permite guardar
   - Admin: Mensaje de error claro

## 📊 Flujo de Datos

```
Usuario → FormularioSoporteComponent.ngOnInit()
    ↓
FormularioTemplateService.getPorModulo(moduloId)
    ↓
API GET /api/formularios/modulo/{moduloId}
    ↓
FormularioTemplateController.porModulo()
    ↓
FormularioTemplate::porModulo($moduloId)
    ↓
whereJsonContains('modulos_asignados', $moduloId)
    ↓
with('campos').first()
    ↓
Return JSON con formulario + campos ordenados
    ↓
FormularioSoporteComponent renderiza dinámicamente
    ↓
Usuario completa y envía →
    ↓
TicketController.store() con campos personalizados
    ↓
Email a soporte con datos formateados
```

## 🔄 Actualización de Formularios

### Cambiar Formulario de un Módulo

1. Editar formulario existente
2. Agregar/Quitar módulo en `modulos_asignados`
3. Guardar cambios
4. **Efecto inmediato**: Próximo usuario verá nuevo formulario

### Versionar Formularios (Opción Futura)

Actualmente los cambios son inmediatos. Para versionar:

- Duplicar formulario antes de editar
- Mantener versión anterior inactiva como respaldo
- Asignar nueva versión a módulos

## 🚧 Limitaciones Conocidas

1. **Drag-and-Drop Visual**: Actualmente es click-to-add, no drag real
2. **Validación Avanzada**: Regex básico, sin validación cruzada de campos
3. **Campos Condicionales**: No soporta "mostrar campo X si campo Y = Z"
4. **Módulos Dropdown**: Lista hardcodeada, falta integración con API de módulos
5. **Preview de File**: Solo para imágenes, no otros tipos

## 🔮 Mejoras Futuras

- 🎯 Drag-and-drop real con CDK de Angular
- 🔗 Dependencias condicionales entre campos
- 📱 App móvil para constructor
- 📊 Analytics de uso de formularios
- 🌐 Multi-idioma para formularios
- 🎨 Temas personalizables
- 📤 Export/Import de formularios (JSON)
- 🔄 Historial de versiones
- 👥 Colaboración en tiempo real
- 🤖 IA para sugerir campos comunes

## 📞 Soporte y Contacto

Para dudas sobre la implementación:

- Documentación código: Comentarios inline en archivos
- Arquitectura: Este documento (CONSTRUCTOR_FORMULARIOS.md)
- Bugs: Ver logs en Laravel (storage/logs/laravel.log)
- Errores frontend: Console del navegador

---

**Última actualización**: 10 de Febrero de 2026  
**Versión**: 1.0.0  
**Autor**: Sistema FAQ IDARTES
