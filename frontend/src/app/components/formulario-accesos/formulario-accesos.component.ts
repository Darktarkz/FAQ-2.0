import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SolicitudAccesoService } from '../../services/solicitud-acceso.service';
import { Dependencia } from '../../models/solicitud-acceso.model';

// ─── Datos estáticos de plataformas ──────────────────────────────────────────

const ROLES_CONTRATACION = [
  'Abogado',
  'Talento humano',
  'Financiera',
  'Proyecto',
  'Reviso',
  'Superviso',
  'Ordenador de gasto',
];

const ROLES_CAJA_MENOR = ['Solicitante', 'Ordenador de gasto'];

const DEPENDENCIAS: Dependencia[] = [
  { id: 1,  nombre: 'Dirección General' },
  { id: 2,  nombre: 'Subdirección de las Artes' },
  { id: 3,  nombre: 'Subdirección de Formación Artística' },
  { id: 4,  nombre: 'Subdirección de Equipamientos Culturales' },
  { id: 5,  nombre: 'Subdirección Administrativa y Financiera' },
  { id: 6,  nombre: 'Oficina Asesora Planeación y tecnologías de la información' },
  { id: 7,  nombre: 'Subdirección Jurídica' },
  { id: 8,  nombre: 'Asesoría de Comunicaciones' },
  { id: 9,  nombre: 'Asesoría de Control Interno' },
  { id: 10, nombre: 'Gerencia de Danza' },
  { id: 11, nombre: 'Gerencia de Artes Audiovisuales' },
  { id: 12, nombre: 'Gerencia de Escenarios' },
  { id: 13, nombre: 'Gerencia de Arte Dramático' },
  { id: 14, nombre: 'Gerencia de Artes Plásticas y Visuales' },
  { id: 15, nombre: 'Gerencia de Música' },
  { id: 16, nombre: 'Gerencia de Literatura' },
  { id: 17, nombre: 'Talento Humano' },
  { id: 18, nombre: 'Gerencia Nidos' },
  { id: 19, nombre: 'Gerencia Crea' },
  { id: 20, nombre: 'Línea Estratégica Arte Ciencia y Tecnología' },
  { id: 21, nombre: 'Línea Estratégica Emprendimiento' },
  { id: 22, nombre: 'Convocatorias' },
  { id: 23, nombre: 'Teatro Mayor Julio Mario Santo Domingo' },
  { id: 24, nombre: 'Planetario de Bogotá' },
  { id: 25, nombre: 'Área de Producción' },
  { id: 26, nombre: 'Servicios Generales' },
  { id: 27, nombre: 'Gestión Documental' },
  { id: 28, nombre: 'Culturas en Común' },
  { id: 29, nombre: 'Linea Arte y Memoria sin Fronteras' },
  { id: 30, nombre: 'GALERÍA Santa Fe' },
  { id: 31, nombre: 'Gerencia de Contratación' },
  { id: 32, nombre: 'Subdirección de Infraestructura' },
  { id: 33, nombre: 'Gerencia de Escenarios Territoriales' },
];

const MODULOS_SICAPITAL = [
  'Módulo Almacén',
  'Módulo Contratación',
  'Módulo Control de Activos',
  'Módulo Control Interno',
  'Módulo Producción',
  'Módulo Planeación',
];

export const PANDORA_MODULOS_ROLES: Record<string, string[]> = {
  'Módulo Almacén': [
    'Auxiliar De Inventario',
    'Almacenista General',
    'Coordinador De Inventario',
  ],
  'Módulo Contratación': [
    'Supervisor',
    'Jefe De Área / Profesional Del Área',
    'Apoyo Del Área',
    'Apoyo Supervisión',
    'Contratista',
    'Rol Soporte Informe De Pago',
    'Usuario Reportes Informe De Pago',
    'Usuario Configuración Periodos De Cierres Informe De Pago',
  ],
  'Módulo Control De Activos': [
    'Administrador Control de activos',
    'Técnica Control de activos',
    'Usuario de consulta Control de activos',
  ],
  'Módulo Control Interno': ['Auditor', 'Delegado', 'Encargado'],
  'Módulo Producción': [
    'Administrador Producción',
    'Apoyo Supervisión Producción',
    'Gerente del Área',
    'Gestor Producción',
    'Administrativa de Producción',
    'Líder de la Oficina de Producción',
    'Supervisión de Producción',
    'Ordenador del Gasto Producción',
    'Responsable de la unidad de gestión',
    'Subdirector(a) de las artes',
    'Subdirector(a) de administrativa y financiera',
    'Subdirector(a) de equipamientos',
    'Subdirector(a) de formación artística',
    'Productor(a) encargado de la Unidad de Gestión del Área de Producción',
    'Apoyo administrativo de Área de Producción',
    'Profesional administrativo de Área de Producción',
    'Productores Generales Área de Producción',
    'Revisión subdirección de las artes',
    'Responsable Creación Hoja De Vida',
    'Consultor Hojas de vida general',
    'Subdirector(a) de las artes (E)',
    'Subdirector(a) de administrativa y financiera (E)',
    'Subdirector(a) de equipamientos (E)',
    'Subdirector(a) de formación artística (E)',
    'Consultas Producción',
  ],
  'Módulo Planeación': [
    'Gestor Plan De Desarrollo',
    'Gestor Plan Estratégico',
    'Jefe De La Oficina Asesora De Planeación Y Tecnologías De La Información',
    'Profesional De Planeación',
    'Misional Proyectos De Inversión',
    'Analista Oap',
    'Jefe Presupuesto Planeación',
    'Administrativo Presupuesto',
    'Ordenador De Gasto Presupuesto',
    'Consulta Plan De Desarrollo Y Estratégico',
    '1. Validación Del Área',
    'Parametrizador Planeación',
    'Jefe De La Oficina Asesora De Planeación Y Tecnologías De La Información',
    'Consultas Directivos Proyectos',
    'Líder De La Línea Arte Y Memoria Sin Fronteras',
    'Profesional Jurídico Presupuesto',
    '2. Validación Administrativa',
    'Responsable Presupuesto',
    'Consulta Informe Presupuesto',
    'Sig Planeación',
    'Anteproyecto Presupuesto',
    'Registrador Seguimiento Cuantitativo Interno / Externo',
    'Registrador Seguimiento Estímulos Y Jurados',
    'Validador Seguimiento Actividades',
    'Validador Seguimiento Estímulos / Jurados',
    'Usuario Registro Seguimiento Plan De Acción',
    'Enlace Mipg',
    'Referente Mipg',
    'Sig Misional',
    'Líder Sig',
    'Anulador Cdp Funcionamiento',
    'Administrativo Presupuesto Funcionamiento',
    'Ordenador De Gasto Presupuesto',
    'Visualizador Sig',
    'Usuario Registro Seguimiento Indicador De Gestión',
    'Usuario Admin Indicador',
    'Líder De Proceso',
    'Presupuesto Registro Covid',
    'Apoyo Jurídico',
    'Apoyo Planeación',
    'Usuario Consulta Control Interno',
    'Usuario Registro Pac',
    'Usuario Consulta General',
    'Aprobación Anteproyecto Funcionamiento',
    'Sap Pasivos',
    'Profesional Especializado De Talento Humano',
    'Política Pública Parametrizador',
    'Consulta Plan Estratégico E Indicadores',
    'Usuario Configuración Periodos De Cierre',
    'Consultas Proyectos De Inversión',
    'Administrador Plan Estratégico',
    'Usuario Responsable Expediente Orfeo',
    'Consultas Riesgo',
  ],
};

@Component({
  selector: 'app-formulario-accesos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulario-accesos.component.html',
  styleUrls: ['./formulario-accesos.component.css'],
})
export class FormularioAccesosComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  readonly dependencias: Dependencia[] = DEPENDENCIAS;

  enviando = false;
  enviado = false;
  errorEnvio: string | null = null;
  numeroCaso: string | null = null;

  // Archivos de firma
  orfeoFirma: File | null = null;
  contratacionFirma: File | null = null;

  // Datos estáticos expuestos al template
  readonly rolesContratacion = ROLES_CONTRATACION;
  readonly rolesCajaMenor = ROLES_CAJA_MENOR;
  readonly modulosSicapital = MODULOS_SICAPITAL;
  readonly pandoraModulosRoles = PANDORA_MODULOS_ROLES;
  readonly pandoraModulos = Object.keys(PANDORA_MODULOS_ROLES);

  // Roles disponibles según módulo PANDORA seleccionado
  pandoraRolesDisponibles: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private solicitudService: SolicitudAccesoService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.setupReactiveListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Construcción del formulario ─────────────────────────────────────────

  private buildForm(): void {
    this.form = this.fb.group({
      // Datos personales
      nombre_completo: ['', [Validators.required, Validators.maxLength(255)]],
      tipo_documento: ['', Validators.required],
      numero_documento: ['', [Validators.required, Validators.maxLength(50)]],
      usuario_red: ['', [Validators.required, Validators.maxLength(100)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      dependencia_id: ['', Validators.required],
      cargo_tipo: ['', Validators.required],
      cargo_nombre: [''],

      // Checkboxes de plataformas
      plataforma_sif: [false],
      plataforma_orfeo: [false],
      plataforma_contratacion: [false],
      plataforma_caja_menor: [false],
      plataforma_sicapital: [false],
      plataforma_pandora: [false],

      // Campos SIF
      sif_programa_sfa: [''],
      sif_rol_desempena: [''],

      // Campos CONTRATACIÓN
      contratacion_rol_acceso: [''],

      // Campos CAJA MENOR
      caja_menor_rol_acceso: [''],

      // Campos SICAPITAL
      sicapital_modulo: [''],

      // Campos PANDORA
      pandora_modulo: [''],
      pandora_rol: [''],
    });
  }

  // ─── Listeners reactivos ─────────────────────────────────────────────────

  private setupReactiveListeners(): void {
    // Cargo tipo → validar/limpiar cargo_nombre
    this.form.get('cargo_tipo')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((tipo) => {
      const cargoNombre = this.form.get('cargo_nombre')!;
      if (tipo === 'funcionario') {
        cargoNombre.setValidators([Validators.required, Validators.maxLength(255)]);
      } else {
        cargoNombre.clearValidators();
        cargoNombre.setValue('');
      }
      cargoNombre.updateValueAndValidity();
    });

    // Plataforma SIF → validar campos SIF
    this.form.get('plataforma_sif')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((activa) => {
      this.toggleValidators('sif_programa_sfa', activa, [Validators.required]);
      this.toggleValidators('sif_rol_desempena', activa, [Validators.required]);
      if (!activa) {
        this.form.get('sif_programa_sfa')!.setValue('');
        this.form.get('sif_rol_desempena')!.setValue('');
      }
    });

    // Plataforma CONTRATACIÓN → validar campos
    this.form.get('plataforma_contratacion')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((activa) => {
      this.toggleValidators('contratacion_rol_acceso', activa, [Validators.required]);
      if (!activa) {
        this.form.get('contratacion_rol_acceso')!.setValue('');
        this.contratacionFirma = null;
      }
    });

    // Plataforma CAJA MENOR → validar roles
    this.form.get('plataforma_caja_menor')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((activa) => {
      this.toggleValidators('caja_menor_rol_acceso', activa, [Validators.required]);
      if (!activa) {
        this.form.get('caja_menor_rol_acceso')!.setValue('');
      }
    });

    // Plataforma SICAPITAL → validar módulo
    this.form.get('plataforma_sicapital')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((activa) => {
      this.toggleValidators('sicapital_modulo', activa, [Validators.required]);
      if (!activa) {
        this.form.get('sicapital_modulo')!.setValue('');
      }
    });

    // Plataforma PANDORA → validar módulo y rol
    this.form.get('plataforma_pandora')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((activa) => {
      this.toggleValidators('pandora_modulo', activa, [Validators.required]);
      this.toggleValidators('pandora_rol', activa, [Validators.required]);
      if (!activa) {
        this.form.get('pandora_modulo')!.setValue('');
        this.form.get('pandora_rol')!.setValue('');
        this.pandoraRolesDisponibles = [];
      }
    });

    // PANDORA módulo → actualizar roles disponibles
    this.form.get('pandora_modulo')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((modulo) => {
      this.pandoraRolesDisponibles = modulo ? (PANDORA_MODULOS_ROLES[modulo] ?? []) : [];
      this.form.get('pandora_rol')!.setValue('');
    });

    // ORFEO desactivada → limpiar firma
    this.form.get('plataforma_orfeo')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((activa) => {
      if (!activa) {
        this.orfeoFirma = null;
      }
    });
  }

  private toggleValidators(controlName: string, activo: boolean, validators: any[]): void {
    const ctrl = this.form.get(controlName)!;
    if (activo) {
      ctrl.setValidators(validators);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }

  // ─── Getters de acceso rápido ─────────────────────────────────────────────

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  esFuncionario(): boolean {
    return this.form.get('cargo_tipo')?.value === 'funcionario';
  }

  plataformaActiva(nombre: string): boolean {
    return !!this.form.get(`plataforma_${nombre}`)?.value;
  }

  algunaPlataformaSeleccionada(): boolean {
    return ['sif', 'orfeo', 'contratacion', 'caja_menor', 'sicapital', 'pandora'].some(
      (p) => this.plataformaActiva(p)
    );
  }

  // ─── Manejo de archivos ───────────────────────────────────────────────────

  onOrfeoFirmaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.orfeoFirma = input.files?.[0] ?? null;
  }

  onContratacionFirmaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.contratacionFirma = input.files?.[0] ?? null;
  }

  // ─── Envío ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || !this.algunaPlataformaSeleccionada()) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    // Construir objeto de plataformas seleccionadas
    const plataformas: Record<string, any> = {};

    if (v.plataforma_sif) {
      plataformas['sif'] = {
        programa_sfa: v.sif_programa_sfa,
        rol_desempena: v.sif_rol_desempena,
      };
    }
    if (v.plataforma_orfeo) {
      plataformas['orfeo'] = {};
    }
    if (v.plataforma_contratacion) {
      plataformas['contratacion'] = { rol_acceso: v.contratacion_rol_acceso };
    }
    if (v.plataforma_caja_menor) {
      plataformas['caja_menor'] = { rol_acceso: v.caja_menor_rol_acceso };
    }
    if (v.plataforma_sicapital) {
      plataformas['sicapital'] = { modulo: v.sicapital_modulo };
    }
    if (v.plataforma_pandora) {
      plataformas['pandora'] = { modulo: v.pandora_modulo, rol: v.pandora_rol };
    }

    const fd = new FormData();
    fd.append('nombre_completo', v.nombre_completo);
    fd.append('tipo_documento', v.tipo_documento);
    fd.append('numero_documento', v.numero_documento);
    fd.append('usuario_red', v.usuario_red);
    fd.append('correo', v.correo);
    fd.append('dependencia_id', v.dependencia_id);
    fd.append('cargo_tipo', v.cargo_tipo);
    if (v.cargo_nombre) fd.append('cargo_nombre', v.cargo_nombre);
    fd.append('plataformas', JSON.stringify(plataformas));

    if (this.orfeoFirma) fd.append('orfeo_firma', this.orfeoFirma);
    if (this.contratacionFirma) fd.append('contratacion_firma', this.contratacionFirma);

    this.enviando = true;
    this.errorEnvio = null;

    this.solicitudService.crear(fd).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.enviando = false;
        this.enviado = true;
        this.numeroCaso = `SOL-${res.solicitud?.id?.toString().padStart(5, '0') ?? '?'}`;
        this.form.reset();
        this.orfeoFirma = null;
        this.contratacionFirma = null;
      },
      error: (err) => {
        this.enviando = false;
        this.errorEnvio =
          err?.error?.message ?? 'Ocurrió un error al enviar la solicitud. Intente de nuevo.';
      },
    });
  }

  nuevaSolicitud(): void {
    this.enviado = false;
    this.numeroCaso = null;
    this.errorEnvio = null;
    this.form.reset();
    this.pandoraRolesDisponibles = [];
  }

  // ─── Helpers de validación para el template ───────────────────────────────

  campoInvalido(nombre: string): boolean {
    const ctrl = this.form.get(nombre);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}
