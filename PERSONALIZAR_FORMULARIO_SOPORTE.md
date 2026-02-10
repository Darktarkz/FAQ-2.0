# Personalizar Formulario de Soporte por Módulo

## 📌 Archivos a Modificar

- **HTML**: `frontend/src/app/components/formulario-soporte/formulario-soporte.component.html`
- **TypeScript**: `frontend/src/app/components/formulario-soporte/formulario-soporte.component.ts`

---

## 🎯 Método 1: Campos Condicionales por ID de Módulo

### Paso 1: Agregar campos adicionales en el TypeScript

```typescript
// En formulario-soporte.component.ts

export class FormularioSoporteComponent implements OnInit {
  @Input() moduloId!: number;
  @Input() moduloNombre!: string;

  // Datos del formulario (AGREGAR NUEVOS CAMPOS AQUÍ)
  ticket: Ticket = {
    modulo_id: 0,
    nombre_completo: "",
    tipo_identificacion: "CC",
    cedula: "",
    correo: "",
    telefono: "",
    numero_contrato: "",
    descripcion: "",
    // CAMPOS ADICIONALES:
    plataforma: "", // Para módulos de plataformas específicas
    rol_usuario: "", // Para módulos con roles
    fecha_incidente: "", // Para reportes temporales
    area_organizacion: "", // Para módulos organizacionales
    tipo_solicitud: "", // Para diferentes tipos de tickets
    prioridad_usuario: "", // Si el usuario puede indicar prioridad
  };

  // Método para verificar qué campos mostrar según el módulo
  mostrarCampoPlataforma(): boolean {
    // IDs de módulos que necesitan campo "Plataforma"
    const modulosConPlataforma = [1, 5, 8]; // Pandora, Comunica, etc.
    return modulosConPlataforma.includes(this.moduloId);
  }

  mostrarCampoRol(): boolean {
    // IDs de módulos que necesitan campo "Rol"
    const modulosConRol = [2, 3, 7]; // Módulos con roles de usuario
    return modulosConRol.includes(this.moduloId);
  }

  mostrarCampoContrato(): boolean {
    // IDs de módulos que necesitan campo "Contrato"
    const modulosConContrato = [10, 11, 12]; // Módulos financieros
    return modulosConContrato.includes(this.moduloId);
  }

  obtenerOpcionesPlataforma(): string[] {
    // Opciones específicas según el módulo
    switch (this.moduloId) {
      case 1: // Pandora
        return ["Pandora Web", "Pandora Desktop", "Pandora Móvil"];
      case 5: // Comunica
        return ["Comunica Web", "Comunica App"];
      default:
        return ["Plataforma 1", "Plataforma 2"];
    }
  }
}
```

### Paso 2: Agregar campos condicionales en el HTML

```html
<!-- En formulario-soporte.component.html -->

<!-- Después de la sección "Información Personal", AGREGAR: -->

<!-- CAMPO CONDICIONAL: Plataforma -->
<div class="form-group" *ngIf="mostrarCampoPlataforma()">
  <label for="plataforma"> Plataforma <span class="requerido">*</span> </label>
  <select
    id="plataforma"
    [(ngModel)]="ticket.plataforma"
    name="plataforma"
    [required]="mostrarCampoPlataforma()"
  >
    <option value="">Selecciona una plataforma</option>
    <option *ngFor="let plat of obtenerOpcionesPlataforma()" [value]="plat">
      {{ plat }}
    </option>
  </select>
</div>

<!-- CAMPO CONDICIONAL: Rol de Usuario -->
<div class="form-group" *ngIf="mostrarCampoRol()">
  <label for="rol_usuario">
    Rol en el Sistema <span class="requerido">*</span>
  </label>
  <select
    id="rol_usuario"
    [(ngModel)]="ticket.rol_usuario"
    name="rol_usuario"
    [required]="mostrarCampoRol()"
  >
    <option value="">Selecciona tu rol</option>
    <option value="administrador">Administrador</option>
    <option value="usuario">Usuario</option>
    <option value="supervisor">Supervisor</option>
    <option value="consultor">Consultor</option>
  </select>
</div>

<!-- CAMPO CONDICIONAL: Fecha del Incidente -->
<div class="form-group" *ngIf="moduloId === 15">
  <label for="fecha_incidente"> Fecha del Incidente </label>
  <input
    type="date"
    id="fecha_incidente"
    [(ngModel)]="ticket.fecha_incidente"
    name="fecha_incidente"
  />
</div>

<!-- CAMPO CONDICIONAL: Área de Organización -->
<div class="form-group" *ngIf="moduloId === 20">
  <label for="area_organizacion"> Área o Departamento </label>
  <input
    type="text"
    id="area_organizacion"
    [(ngModel)]="ticket.area_organizacion"
    name="area_organizacion"
    placeholder="Ej: Recursos Humanos"
  />
</div>
```

---

## 🎯 Método 2: Configuración de Campos por Módulo (Más Escalable)

### Paso 1: Crear archivo de configuración

Crea: `frontend/src/app/config/formularios-modulo.config.ts`

```typescript
export interface CampoFormulario {
  nombre: string;
  label: string;
  tipo: "text" | "email" | "tel" | "date" | "select" | "textarea";
  requerido: boolean;
  placeholder?: string;
  opciones?: string[];
}

export interface ConfiguracionFormulario {
  moduloId: number;
  moduloNombre: string;
  camposAdicionales: CampoFormulario[];
}

export const CONFIGURACIONES_FORMULARIO: ConfiguracionFormulario[] = [
  {
    moduloId: 1, // Pandora Login
    moduloNombre: "Pandora",
    camposAdicionales: [
      {
        nombre: "plataforma",
        label: "Plataforma",
        tipo: "select",
        requerido: true,
        opciones: ["Pandora Web", "Pandora Desktop", "Pandora Móvil"],
      },
      {
        nombre: "navegador",
        label: "Navegador",
        tipo: "select",
        requerido: false,
        opciones: ["Chrome", "Firefox", "Safari", "Edge"],
      },
    ],
  },
  {
    moduloId: 5, // Comunica
    moduloNombre: "Comunica",
    camposAdicionales: [
      {
        nombre: "tipo_comunicacion",
        label: "Tipo de Comunicación",
        tipo: "select",
        requerido: true,
        opciones: ["Email", "Chat", "Videollamada", "Notificación"],
      },
    ],
  },
  {
    moduloId: 10, // Nómina
    moduloNombre: "Nómina",
    camposAdicionales: [
      {
        nombre: "periodo_nomina",
        label: "Periodo de Nómina",
        tipo: "text",
        requerido: true,
        placeholder: "Ej: Enero 2026",
      },
      {
        nombre: "tipo_contrato",
        label: "Tipo de Contrato",
        tipo: "select",
        requerido: true,
        opciones: ["Prestación de Servicios", "Laboral", "Por Obra"],
      },
    ],
  },
  // AGREGAR MÁS CONFIGURACIONES AQUÍ...
];
```

### Paso 2: Usar la configuración en el componente

```typescript
// En formulario-soporte.component.ts

import {
  CONFIGURACIONES_FORMULARIO,
  CampoFormulario,
} from "../../config/formularios-modulo.config";

export class FormularioSoporteComponent implements OnInit {
  @Input() moduloId!: number;
  @Input() moduloNombre!: string;

  camposAdicionales: CampoFormulario[] = [];
  camposDinamicos: { [key: string]: any } = {};

  ngOnInit(): void {
    this.ticket.modulo_id = this.moduloId;
    this.cargarCamposAdicionales();
  }

  cargarCamposAdicionales(): void {
    const config = CONFIGURACIONES_FORMULARIO.find(
      (c) => c.moduloId === this.moduloId,
    );
    if (config) {
      this.camposAdicionales = config.camposAdicionales;
      // Inicializar valores
      this.camposAdicionales.forEach((campo) => {
        this.camposDinamicos[campo.nombre] = "";
      });
    }
  }

  enviarTicket(): void {
    // ... validaciones existentes ...

    const formData = new FormData();
    formData.append("modulo_id", this.ticket.modulo_id.toString());
    // ... campos existentes ...

    // AGREGAR CAMPOS DINÁMICOS
    this.camposAdicionales.forEach((campo) => {
      const valor = this.camposDinamicos[campo.nombre];
      if (valor) {
        formData.append(campo.nombre, valor);
      }
    });

    // ... enviar formData ...
  }
}
```

### Paso 3: Renderizar campos dinámicos en HTML

```html
<!-- En formulario-soporte.component.html -->

<!-- Después de "Información Personal", agregar: -->
<div class="seccion-formulario" *ngIf="camposAdicionales.length > 0">
  <h3>Información Adicional del Módulo</h3>

  <ng-container *ngFor="let campo of camposAdicionales">
    <!-- Campo tipo SELECT -->
    <div class="form-group" *ngIf="campo.tipo === 'select'">
      <label [for]="campo.nombre">
        {{ campo.label }}
        <span class="requerido" *ngIf="campo.requerido">*</span>
      </label>
      <select
        [id]="campo.nombre"
        [(ngModel)]="camposDinamicos[campo.nombre]"
        [name]="campo.nombre"
        [required]="campo.requerido"
      >
        <option value="">Selecciona una opción</option>
        <option *ngFor="let opcion of campo.opciones" [value]="opcion">
          {{ opcion }}
        </option>
      </select>
    </div>

    <!-- Campo tipo TEXT -->
    <div class="form-group" *ngIf="campo.tipo === 'text'">
      <label [for]="campo.nombre">
        {{ campo.label }}
        <span class="requerido" *ngIf="campo.requerido">*</span>
      </label>
      <input
        type="text"
        [id]="campo.nombre"
        [(ngModel)]="camposDinamicos[campo.nombre]"
        [name]="campo.nombre"
        [placeholder]="campo.placeholder || ''"
        [required]="campo.requerido"
      />
    </div>

    <!-- Campo tipo DATE -->
    <div class="form-group" *ngIf="campo.tipo === 'date'">
      <label [for]="campo.nombre">
        {{ campo.label }}
        <span class="requerido" *ngIf="campo.requerido">*</span>
      </label>
      <input
        type="date"
        [id]="campo.nombre"
        [(ngModel)]="camposDinamicos[campo.nombre]"
        [name]="campo.nombre"
        [required]="campo.requerido"
      />
    </div>
  </ng-container>
</div>
```

---

## 🔧 Backend: Guardar Campos Adicionales

### Opción 1: Agregar columnas a la tabla tickets

```php
// Crear nueva migración
php artisan make:migration add_custom_fields_to_tickets_table

// En la migración:
public function up(): void
{
    Schema::table('tickets', function (Blueprint $table) {
        $table->string('plataforma')->nullable();
        $table->string('rol_usuario')->nullable();
        $table->string('navegador')->nullable();
        $table->string('tipo_comunicacion')->nullable();
        $table->string('periodo_nomina')->nullable();
        // ... más campos según necesites
    });
}
```

### Opción 2: Usar un campo JSON (Más flexible)

```php
// Migración:
public function up(): void
{
    Schema::table('tickets', function (Blueprint $table) {
        $table->json('campos_adicionales')->nullable();
    });
}

// En el Modelo Ticket.php:
protected $casts = [
    'campos_adicionales' => 'array',
];

// En TicketController.php al guardar:
$camposAdicionales = [];
foreach ($request->all() as $key => $value) {
    if (!in_array($key, ['modulo_id', 'nombre_completo', 'correo', etc...])) {
        $camposAdicionales[$key] = $value;
    }
}

$ticket->campos_adicionales = $camposAdicionales;
```

---

## 📝 Ejemplo Práctico Completo

Para el módulo **Pandora (ID: 1)**, agregar campos de plataforma y navegador:

1. Edita `formulario-soporte.component.ts` línea ~50:

```typescript
mostrarCampoPandora(): boolean {
  return this.moduloId === 1;
}
```

2. Edita `formulario-soporte.component.html` después de línea ~108:

```html
<div class="form-group" *ngIf="mostrarCampoPandora()">
  <label for="plataforma_pandora">
    Plataforma Pandora <span class="requerido">*</span>
  </label>
  <select
    id="plataforma_pandora"
    [(ngModel)]="ticket.plataforma"
    name="plataforma"
    required
  >
    <option value="">Selecciona</option>
    <option value="web">Pandora Web</option>
    <option value="desktop">Pandora Desktop</option>
    <option value="movil">Pandora Móvil</option>
  </select>
</div>
```

3. Agrega en interface Ticket (ticket.service.ts):

```typescript
export interface Ticket {
  // ... campos existentes
  plataforma?: string;
}
```

4. Backend - actualiza Ticket.php fillable:

```php
protected $fillable = [
    // ... campos existentes
    'plataforma',
];
```

---

## 🎨 Tips de UX

1. **Agrupación**: Usa `<div class="seccion-formulario">` para agrupar campos relacionados
2. **Orden lógico**: Coloca campos específicos después de campos generales
3. **Tooltips**: Agrega `<small class="help-text">` para instrucciones
4. **Validación**: Usa `[required]="condicion"` para campos condicionales obligatorios

---

## 📚 Resumen Rápido

| Método                         | Ventajas              | Cuándo usar                           |
| ------------------------------ | --------------------- | ------------------------------------- |
| **Condicionales simples**      | Rápido, directo       | 1-3 campos adicionales por módulo     |
| **Configuración centralizada** | Escalable, mantenible | Muchos módulos con campos diferentes  |
| **Campo JSON en BD**           | Máxima flexibilidad   | Campos muy variables o experimentales |

¿Quieres que implemente algún campo específico para un módulo en particular?
