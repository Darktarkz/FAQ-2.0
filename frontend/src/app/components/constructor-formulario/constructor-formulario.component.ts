import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FormularioTemplateService, FormularioTemplate, FormularioCampo } from '../../services/formulario-template.service';

interface TipoCampo {
  tipo: string;
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-constructor-formulario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './constructor-formulario.component.html',
  styleUrl: './constructor-formulario.component.css'
})
export class ConstructorFormularioComponent implements OnInit {
  formulario: FormularioTemplate = {
    nombre: '',
    descripcion: '',
    modulos_asignados: [],
    activo: true,
    campos: []
  };

  modoEdicion = false;
  idFormulario?: number;
  
  // Estado de UI
  cargando = false;
  guardando = false;
  error = '';
  exito = '';
  vistaPrevia = false;
  campoSeleccionado: FormularioCampo | null = null;
  campoIndex: number = -1;

  // Tipos de campos disponibles
  tiposCampos: TipoCampo[] = [
    { tipo: 'text', nombre: 'Texto', icono: '📝' },
    { tipo: 'email', nombre: 'Email', icono: '📧' },
    { tipo: 'tel', nombre: 'Teléfono', icono: '📱' },
    { tipo: 'number', nombre: 'Número', icono: '🔢' },
    { tipo: 'date', nombre: 'Fecha', icono: '📅' },
    { tipo: 'select', nombre: 'Selección', icono: '📋' },
    { tipo: 'textarea', nombre: 'Área texto', icono: '📄' },
    { tipo: 'file', nombre: 'Archivo', icono: '📎' },
    { tipo: 'checkbox', nombre: 'Checkbox', icono: '☑️' },
    { tipo: 'radio', nombre: 'Radio', icono: '🔘' }
  ];

  // Módulos disponibles (se cargarán desde la API)
  modulosDisponibles: any[] = [];
  moduloSeleccionado: number = 0;

  // Vista de opciones para select/radio
  opcionesTexto: string = '';

  constructor(
    private formularioService: FormularioTemplateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar si es modo edición
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.idFormulario = +params['id'];
        this.modoEdicion = true;
        this.cargarFormulario(this.idFormulario);
      }
    });

    this.cargarModulos();
  }

  cargarFormulario(id: number): void {
    this.cargando = true;
    this.formularioService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.formulario) {
          this.formulario = response.formulario;
          this.formulario.campos.sort((a, b) => a.orden - b.orden);
        } else {
          this.error = 'Formulario no encontrado';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar formulario:', err);
        this.error = 'Error al cargar el formulario';
        this.cargando = false;
      }
    });
  }

  cargarModulos(): void {
    // TODO: Implementar llamada a la API de módulos
    // Por ahora dejamos el array vacío, se puede agregar después
    this.modulosDisponibles = [];
  }

  agregarCampo(tipoCampo: TipoCampo): void {
    const nuevoCampo: FormularioCampo = {
      nombre_campo: `campo_${Date.now()}`,
      etiqueta: `Nuevo ${tipoCampo.nombre}`,
      tipo: tipoCampo.tipo as any,
      placeholder: '',
      descripcion_ayuda: '',
      requerido: false,
      opciones: (tipoCampo.tipo === 'select' || tipoCampo.tipo === 'radio') ? [] : null,
      validacion: null,
      orden: this.formulario.campos.length,
      tamano_columna: 12
    };

    this.formulario.campos.push(nuevoCampo);
    this.seleccionarCampo(nuevoCampo, this.formulario.campos.length - 1);
  }

  seleccionarCampo(campo: FormularioCampo, index: number): void {
    this.campoSeleccionado = campo;
    this.campoIndex = index;
    
    // Convertir opciones a texto para mostrar en textarea
    if (campo.opciones && Array.isArray(campo.opciones)) {
      this.opcionesTexto = campo.opciones.join('\n');
    } else {
      this.opcionesTexto = '';
    }
  }

  actualizarOpciones(): void {
    if (this.campoSeleccionado) {
      const lineas = this.opcionesTexto.split('\n').filter(l => l.trim() !== '');
      this.campoSeleccionado.opciones = lineas.length > 0 ? lineas : null;
    }
  }

  agregarOpcion(): void {
    if (!this.campoSeleccionado) return;
    
    if (!this.campoSeleccionado.opciones) {
      this.campoSeleccionado.opciones = [];
    }
    
    this.campoSeleccionado.opciones.push(`Opción ${this.campoSeleccionado.opciones.length + 1}`);
  }

  eliminarOpcion(index: number): void {
    if (!this.campoSeleccionado || !this.campoSeleccionado.opciones) return;
    
    if (confirm('¿Eliminar esta opción?')) {
      this.campoSeleccionado.opciones.splice(index, 1);
      
      // Si no quedan opciones, establecer como array vacío
      if (this.campoSeleccionado.opciones.length === 0) {
        this.campoSeleccionado.opciones = [];
      }
    }
  }

  eliminarCampo(index: number): void {
    if (confirm('¿Eliminar este campo?')) {
      this.formulario.campos.splice(index, 1);
      this.reordenarCampos();
      
      if (this.campoIndex === index) {
        this.campoSeleccionado = null;
        this.campoIndex = -1;
      }
    }
  }

  duplicarCampo(index: number): void {
    const campoOriginal = this.formulario.campos[index];
    const campoDuplicado: FormularioCampo = {
      ...campoOriginal,
      nombre_campo: `${campoOriginal.nombre_campo}_copia`,
      etiqueta: `${campoOriginal.etiqueta} (Copia)`,
      orden: this.formulario.campos.length
    };
    
    this.formulario.campos.push(campoDuplicado);
  }

  moverCampo(index: number, direccion: 'arriba' | 'abajo'): void {
    if (direccion === 'arriba' && index > 0) {
      [this.formulario.campos[index], this.formulario.campos[index - 1]] = 
        [this.formulario.campos[index - 1], this.formulario.campos[index]];
    } else if (direccion === 'abajo' && index < this.formulario.campos.length - 1) {
      [this.formulario.campos[index], this.formulario.campos[index + 1]] = 
        [this.formulario.campos[index + 1], this.formulario.campos[index]];
    }
    this.reordenarCampos();
  }

  reordenarCampos(): void {
    this.formulario.campos.forEach((campo, index) => {
      campo.orden = index;
    });
  }

  agregarModulo(): void {
    if (this.moduloSeleccionado > 0 && !this.formulario.modulos_asignados.includes(this.moduloSeleccionado)) {
      this.formulario.modulos_asignados.push(this.moduloSeleccionado);
      this.moduloSeleccionado = 0;
    }
  }

  quitarModulo(moduloId: number): void {
    const index = this.formulario.modulos_asignados.indexOf(moduloId);
    if (index > -1) {
      this.formulario.modulos_asignados.splice(index, 1);
    }
  }

  toggleVistaPrevia(): void {
    this.vistaPrevia = !this.vistaPrevia;
    if (this.vistaPrevia) {
      this.campoSeleccionado = null;
      this.campoIndex = -1;
    }
  }

  validarYGuardar(): void {
    // Validar formulario
    const errores = this.formularioService.validarFormulario(this.formulario);
    
    if (errores.length > 0) {
      this.error = '❌ Errores de validación:\n' + errores.join('\n');
      return;
    }

    this.reordenarCampos();
    this.guardarFormulario();
  }

  guardarFormulario(): void {
    this.guardando = true;
    this.error = '';
    this.exito = '';

    const operacion = this.modoEdicion && this.idFormulario
      ? this.formularioService.update(this.idFormulario, this.formulario)
      : this.formularioService.create(this.formulario);

    operacion.subscribe({
      next: (response) => {
        if (response.success) {
          this.exito = this.modoEdicion ? '✅ Formulario actualizado' : '✅ Formulario creado';
          setTimeout(() => {
            this.router.navigate(['/admin/formularios']);
          }, 1500);
        } else {
          this.error = response.message || 'Error al guardar';
        }
        this.guardando = false;
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.error = 'Error de conexión al guardar';
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    if (confirm('¿Descartar cambios?')) {
      this.router.navigate(['/admin/formularios']);
    }
  }

  getIconoPorTipo(tipo: string): string {
    return this.formularioService.getIconoPorTipo(tipo);
  }

  // Método trackBy para optimizar el *ngFor de opciones
  trackByIndex(index: number, item: any): number {
    return index;
  }

  // Método para actualizar una opción específica
  actualizarOpcion(index: number, valor: string): void {
    if (this.campoSeleccionado?.opciones) {
      this.campoSeleccionado.opciones[index] = valor;
    }
  }
}
