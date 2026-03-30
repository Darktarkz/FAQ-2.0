import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PreguntaService, Pregunta } from '../../services/pregunta.service';
import { FormularioCampoService, FormularioCampo } from '../../services/formulario-campo.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface PreguntaConfig {
  pregunta_id: number;
  pregunta_texto: string;
  modulo_nombre?: string;
  camposPersonalizados?: FormularioCampo[];
}

@Component({
  selector: 'app-config-formularios-pregunta',
  standalone: true,
  imports: [FormsModule, CommonModule, DragDropModule],
  templateUrl: './config-formularios-pregunta.component.html',
  styleUrls: ['./config-formularios-pregunta.component.css']
})
export class ConfigFormulariosPreg implements OnInit {
  resultadosBusqueda: Pregunta[] = [];
  preguntaSeleccionada: PreguntaConfig | null = null;
  terminoBusqueda: string = '';
  cargando: boolean = false;
  cargandoCampos: boolean = false;
  error: string = '';
  exito: string = '';

  mostrarModalCampo: boolean = false;
  campoEditando: FormularioCampo | null = null;
  nuevoCampo: Partial<FormularioCampo> = this.inicializarCampo();

  plantillaSeleccionada: string | null = null;
  plantillasSeleccionadas: Set<string> = new Set();
  guardandoPlantillas: boolean = false;

  private busquedaSubject = new Subject<string>();

  tiposCampo = [
    { valor: 'text', label: 'Texto' },
    { valor: 'email', label: 'Correo Electrónico' },
    { valor: 'tel', label: 'Teléfono' },
    { valor: 'number', label: 'Número' },
    { valor: 'date', label: 'Fecha' },
    { valor: 'datetime-local', label: 'Fecha y Hora' },
    { valor: 'textarea', label: 'Área de Texto' },
    { valor: 'select', label: 'Lista Desplegable' },
    { valor: 'checkbox', label: 'Casilla de Verificación' },
    { valor: 'radio', label: 'Opción Múltiple' },
    { valor: 'file', label: 'Archivo' }
  ];

  camposPredefinidos = [
    { key: 'nombre_completo', nombre_campo: 'nombre_completo', etiqueta: 'Nombre Completo', tipo: 'text', placeholder: 'Ingrese su nombre completo', tamano_columna: 6, icono: '👤' },
    { key: 'tipo_identificacion', nombre_campo: 'tipo_identificacion', etiqueta: 'Tipo de Identificación', tipo: 'select', opciones: ['CC', 'CE', 'TI', 'NIT', 'Pasaporte'], tamano_columna: 6, icono: '🪪' },
    { key: 'cedula', nombre_campo: 'cedula', etiqueta: 'Número de Documento', tipo: 'text', placeholder: 'Ingrese su número de documento', tamano_columna: 6, icono: '🔢' },
    { key: 'correo', nombre_campo: 'correo', etiqueta: 'Correo Electrónico', tipo: 'email', placeholder: 'ejemplo@correo.com', tamano_columna: 6, icono: '📧' },
    { key: 'numero_contrato', nombre_campo: 'numero_contrato', etiqueta: 'Número de Contrato', tipo: 'text', placeholder: 'Ingrese el número de contrato', tamano_columna: 6, icono: '📄' },
    { key: 'plataforma', nombre_campo: 'plataforma', etiqueta: 'Plataforma', tipo: 'text', placeholder: 'Nombre de la plataforma', tamano_columna: 6, icono: '💻' },
    { key: 'descripcion', nombre_campo: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', placeholder: 'Describa su problema detalladamente', tamano_columna: 12, icono: '📝' },
    { key: 'error_screenshot', nombre_campo: 'error_screenshot', etiqueta: 'Captura de Error', tipo: 'file', descripcion_ayuda: 'Adjunte una captura de pantalla del error', tamano_columna: 12, icono: '📸' },
    { key: 'fecha_hora', nombre_campo: 'fecha', etiqueta: 'Fecha y Hora', tipo: 'datetime-local', tamano_columna: 6, icono: '🕐' },
    { key: 'contacto', nombre_campo: 'contacto', etiqueta: 'Contacto', tipo: 'number', placeholder: 'Número de contacto', tamano_columna: 6, icono: '📞' },
    { key: 'usuario', nombre_campo: 'usuario', etiqueta: 'Usuario', tipo: 'text', placeholder: 'Nombre de usuario', tamano_columna: 6, icono: '🙍' },
    { key: 'rol', nombre_campo: 'rol', etiqueta: 'Rol', tipo: 'text', placeholder: 'Rol del usuario', tamano_columna: 6, icono: '🎭' },
  ];

  constructor(
    private preguntaService: PreguntaService,
    private formularioCampoService: FormularioCampoService
  ) {}

  ngOnInit(): void {
    this.busquedaSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => this.buscarPreguntas(term));
  }

  onBusquedaChange(term: string): void {
    if (!term || term.trim().length < 2) {
      this.resultadosBusqueda = [];
      return;
    }
    this.cargando = true;
    this.busquedaSubject.next(term.trim());
  }

  buscarPreguntas(term: string): void {
    this.preguntaService.searchPreguntas(term).subscribe({
      next: (preguntas) => {
        this.resultadosBusqueda = preguntas.slice(0, 20);
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.error = 'Error al buscar preguntas';
      }
    });
  }

  seleccionarPregunta(pregunta: Pregunta): void {
    const id = pregunta.ID ?? pregunta.id ?? 0;
    this.preguntaSeleccionada = {
      pregunta_id: id,
      pregunta_texto: pregunta.Pregunta,
      modulo_nombre: pregunta.Modulo || pregunta.Submodulo || '',
      camposPersonalizados: []
    };
    this.resultadosBusqueda = [];
    this.terminoBusqueda = '';
    this.cargarCampos();
  }

  cargarCampos(): void {
    if (!this.preguntaSeleccionada) return;
    this.cargandoCampos = true;
    this.formularioCampoService.getPorPregunta(this.preguntaSeleccionada.pregunta_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.preguntaSeleccionada!.camposPersonalizados = response.campos || [];
        }
        this.cargandoCampos = false;
      },
      error: () => {
        this.cargandoCampos = false;
        this.error = 'Error al cargar campos';
      }
    });
  }

  limpiarSeleccion(): void {
    this.preguntaSeleccionada = null;
    this.terminoBusqueda = '';
    this.resultadosBusqueda = [];
  }

  // ========== MODAL CAMPO ==========

  inicializarCampo(): Partial<FormularioCampo> {
    return {
      nombre_campo: '',
      etiqueta: '',
      tipo: 'text',
      placeholder: '',
      descripcion_ayuda: '',
      requerido: false,
      opciones: null,
      validacion: null,
      orden: 0,
      tamano_columna: 12,
      visible: true
    };
  }

  abrirModalAgregar(): void {
    this.campoEditando = null;
    this.nuevoCampo = this.inicializarCampo();
    this.plantillaSeleccionada = null;
    this.plantillasSeleccionadas = new Set();
    this.mostrarModalCampo = true;
  }

  abrirModalEditar(campo: FormularioCampo): void {
    this.campoEditando = campo;
    this.nuevoCampo = { ...campo };
    this.plantillaSeleccionada = null;
    this.mostrarModalCampo = true;
  }

  cerrarModal(): void {
    this.mostrarModalCampo = false;
    this.campoEditando = null;
    this.nuevoCampo = this.inicializarCampo();
    this.plantillaSeleccionada = null;
    this.plantillasSeleccionadas = new Set();
    this.guardandoPlantillas = false;
  }

  seleccionarPlantilla(plantilla: any): void {
    this.plantillaSeleccionada = plantilla.key;
    this.nuevoCampo = {
      nombre_campo: plantilla.nombre_campo,
      etiqueta: plantilla.etiqueta,
      tipo: plantilla.tipo,
      placeholder: (plantilla as any).placeholder || '',
      descripcion_ayuda: (plantilla as any).descripcion_ayuda || '',
      requerido: false,
      opciones: plantilla.opciones ? [...plantilla.opciones] : null,
      validacion: null,
      orden: 0,
      tamano_columna: plantilla.tamano_columna || 12,
      visible: true
    };
  }

  seleccionarPersonalizado(): void {
    this.plantillaSeleccionada = 'personalizado';
    this.nuevoCampo = this.inicializarCampo();
  }

  togglePlantilla(plantilla: any): void {
    if (this.plantillasSeleccionadas.has(plantilla.key)) {
      this.plantillasSeleccionadas.delete(plantilla.key);
    } else {
      this.plantillasSeleccionadas.add(plantilla.key);
    }
  }

  guardarSeleccionados(): void {
    if (!this.preguntaSeleccionada || this.plantillasSeleccionadas.size === 0) return;
    this.guardandoPlantillas = true;

    const seleccionados = this.camposPredefinidos.filter(p =>
      this.plantillasSeleccionadas.has(p.key)
    );

    let completados = 0;
    let errores = 0;

    seleccionados.forEach(plantilla => {
      const campoData: any = {
        pregunta_id: this.preguntaSeleccionada!.pregunta_id,
        nombre_campo: plantilla.nombre_campo,
        etiqueta: plantilla.etiqueta,
        tipo: plantilla.tipo,
        placeholder: (plantilla as any).placeholder || '',
        descripcion_ayuda: (plantilla as any).descripcion_ayuda || '',
        requerido: false,
        opciones: (plantilla as any).opciones ? [...(plantilla as any).opciones] : null,
        validacion: null,
        orden: 0,
        tamano_columna: plantilla.tamano_columna || 12,
        visible: true
      };

      this.formularioCampoService.crear(campoData).subscribe({
        next: (response) => {
          completados++;
          if (!response.success) errores++;
          this.checkPlantillasCompletas(completados, seleccionados.length, errores);
        },
        error: () => {
          completados++;
          errores++;
          this.checkPlantillasCompletas(completados, seleccionados.length, errores);
        }
      });
    });
  }

  private checkPlantillasCompletas(completados: number, total: number, errores: number): void {
    if (completados < total) return;
    this.guardandoPlantillas = false;
    if (errores === 0) {
      this.exito = `${total} campo(s) agregados exitosamente`;
    } else {
      this.exito = `${total - errores} de ${total} campos agregados`;
      if (errores > 0) this.error = `${errores} campo(s) no se pudieron crear`;
    }
    this.cargarCampos();
    this.cerrarModal();
    setTimeout(() => this.exito = '', 3000);
  }

  guardarCampo(): void {
    if (!this.preguntaSeleccionada || !this.nuevoCampo.nombre_campo || !this.nuevoCampo.etiqueta) {
      this.error = 'Por favor completa todos los campos obligatorios';
      return;
    }

    if (['select', 'radio', 'checkbox'].includes(this.nuevoCampo.tipo!) && !this.nuevoCampo.opciones?.length) {
      this.error = 'Debes agregar al menos una opción para este tipo de campo';
      return;
    }

    if (this.campoEditando) {
      this.formularioCampoService.actualizar(this.campoEditando.id!, this.nuevoCampo).subscribe({
        next: (response) => {
          if (response.success) {
            this.exito = 'Campo actualizado exitosamente';
            this.cargarCampos();
            this.cerrarModal();
            setTimeout(() => this.exito = '', 3000);
          } else {
            this.error = response.message || 'Error al actualizar campo';
          }
        },
        error: () => { this.error = 'Error al actualizar el campo'; }
      });
    } else {
      const campoData: any = {
        ...this.nuevoCampo,
        pregunta_id: this.preguntaSeleccionada.pregunta_id
      };
      this.formularioCampoService.crear(campoData).subscribe({
        next: (response) => {
          if (response.success) {
            this.exito = 'Campo creado exitosamente';
            this.cargarCampos();
            this.cerrarModal();
            setTimeout(() => this.exito = '', 3000);
          } else {
            this.error = response.message || 'Error al crear campo';
          }
        },
        error: () => { this.error = 'Error al crear el campo'; }
      });
    }
  }

  eliminarCampo(campo: FormularioCampo): void {
    if (!confirm(`¿Estás seguro de eliminar el campo "${campo.etiqueta}"?`)) return;

    this.formularioCampoService.eliminar(campo.id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.exito = 'Campo eliminado exitosamente';
          this.cargarCampos();
          setTimeout(() => this.exito = '', 3000);
        } else {
          this.error = response.message || 'Error al eliminar campo';
        }
      },
      error: () => { this.error = 'Error al eliminar el campo'; }
    });
  }

  toggleVisibilidad(campo: FormularioCampo): void {
    const estadoAnterior = campo.visible;
    campo.visible = !campo.visible;

    this.formularioCampoService.actualizar(campo.id!, { visible: campo.visible }).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.campo && typeof response.campo.visible === 'boolean') {
            campo.visible = response.campo.visible;
          }
          this.exito = `Campo ${campo.visible ? 'visible' : 'oculto'} exitosamente`;
          setTimeout(() => this.exito = '', 3000);
        } else {
          campo.visible = estadoAnterior;
          this.error = response.message || 'Error al actualizar visibilidad';
          setTimeout(() => this.error = '', 5000);
        }
      },
      error: () => {
        campo.visible = estadoAnterior;
        this.error = 'Error al actualizar visibilidad';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  onDropCampo(event: CdkDragDrop<FormularioCampo[]>): void {
    const campos = this.preguntaSeleccionada?.camposPersonalizados;
    if (!campos || event.previousIndex === event.currentIndex) return;

    moveItemInArray(campos, event.previousIndex, event.currentIndex);
    const ordenData = campos.map((c, i) => ({ id: c.id!, orden: i }));

    this.formularioCampoService.reordenar(ordenData).subscribe({
      next: (response) => {
        if (response.success) {
          this.preguntaSeleccionada!.camposPersonalizados = [...campos];
        } else {
          this.error = 'Error al reordenar campos';
        }
      },
      error: () => { this.error = 'Error al reordenar campos'; }
    });
  }

  moverCampo(index: number, direccion: number): void {
    const campos = this.preguntaSeleccionada?.camposPersonalizados;
    if (!campos) return;
    const nuevoIndex = index + direccion;
    if (nuevoIndex < 0 || nuevoIndex >= campos.length) return;

    [campos[index], campos[nuevoIndex]] = [campos[nuevoIndex], campos[index]];
    const ordenData = campos.map((c, i) => ({ id: c.id!, orden: i }));

    this.formularioCampoService.reordenar(ordenData).subscribe({
      next: (response) => {
        if (response.success) {
          this.preguntaSeleccionada!.camposPersonalizados = [...campos];
        } else {
          [campos[index], campos[nuevoIndex]] = [campos[nuevoIndex], campos[index]];
          this.error = 'Error al reordenar campos';
        }
      },
      error: () => {
        [campos[index], campos[nuevoIndex]] = [campos[nuevoIndex], campos[index]];
        this.error = 'Error al reordenar campos';
      }
    });
  }

  // ========== HELPERS ==========

  get camposOrdenados(): FormularioCampo[] {
    return this.preguntaSeleccionada?.camposPersonalizados || [];
  }

  agregarOpcion(): void {
    if (!this.nuevoCampo.opciones) this.nuevoCampo.opciones = [];
    (this.nuevoCampo.opciones as string[]).push('');
  }

  eliminarOpcion(index: number): void {
    (this.nuevoCampo.opciones as string[]).splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
