import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PreguntaService, Pregunta } from '../../services/pregunta.service';
import { FormularioCampoService, FormularioCampo } from '../../services/formulario-campo.service';
import { AuthService } from '../../services/auth.service';
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

  // Tipo de formulario de la pregunta
  mostrarModalTipo: boolean = false;
  tipoFormulario: 'personalizado' | 'solicitud_acceso' | null = null;
  guardandoTipo: boolean = false;

  // Modal confirmación visual
  mostrarModalConfirmar: boolean = false;
  textoConfirmar: string = '';
  private accionConfirmar: (() => void) | null = null;

  // Tags de opciones
  opcionNuevaTexto: string = '';

  private busquedaSubject = new Subject<string>();

  tiposCampo = [
    { valor: 'text', label: 'Texto corto', descripcion: 'Una sola línea de texto libre' },
    { valor: 'email', label: 'Correo electrónico', descripcion: 'Valida el formato email automáticamente' },
    { valor: 'tel', label: 'Teléfono', descripcion: 'Campo para números telefónicos' },
    { valor: 'number', label: 'Número', descripcion: 'Solo acepta valores numéricos' },
    { valor: 'date', label: 'Fecha', descripcion: 'Selector de fecha (día/mes/año)' },
    { valor: 'datetime-local', label: 'Fecha y hora', descripcion: 'Selector de fecha y hora combinado' },
    { valor: 'textarea', label: 'Texto largo', descripcion: 'Área para respuestas extensas o descripciones' },
    { valor: 'select', label: 'Lista desplegable', descripcion: 'El usuario elige una opción de una lista' },
    { valor: 'checkbox', label: 'Selección múltiple', descripcion: 'El usuario puede marcar varias opciones' },
    { valor: 'radio', label: 'Opción única', descripcion: 'El usuario elige solo una opción entre varias' },
    { valor: 'file', label: 'Adjuntar archivo', descripcion: 'Permite subir documentos o imágenes' }
  ];

  anchoOpciones = [
    { valor: 3, label: 'Cuarto', porcentaje: 25, descripcion: '1/4 del ancho' },
    { valor: 4, label: 'Tercio', porcentaje: 33, descripcion: '1/3 del ancho' },
    { valor: 6, label: 'Mitad', porcentaje: 50, descripcion: '1/2 del ancho' },
    { valor: 12, label: 'Completo', porcentaje: 100, descripcion: 'Ancho total de la fila' },
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
    private formularioCampoService: FormularioCampoService,
    private authService: AuthService
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
        const isAdmin = this.authService.isAdmin();
        const allowedIds = this.authService.getAllowedModuleIds();
        const filtradas = isAdmin
          ? preguntas
          : preguntas.filter(p => p.Idmodulo != null && allowedIds.includes(p.Idmodulo));
        this.resultadosBusqueda = filtradas.slice(0, 20);
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
          // Si ya hay tipo guardado en el backend, usarlo directamente sin mostrar modal
          if (response.tipo) {
            this.tipoFormulario = response.tipo;
          } else {
            // Primera vez: abrir modal de selección
            this.tipoFormulario = null;
            this.mostrarModalTipo = true;
          }
        }
        this.cargandoCampos = false;
      },
      error: () => {
        this.cargandoCampos = false;
        this.error = 'Error al cargar campos';
      }
    });
  }

  confirmarTipoFormulario(tipo: 'personalizado' | 'solicitud_acceso'): void {
    if (!this.preguntaSeleccionada) return;
    this.guardandoTipo = true;
    this.formularioCampoService.setTipoPregunta(this.preguntaSeleccionada.pregunta_id, tipo).subscribe({
      next: (response) => {
        if (response.success) {
          this.tipoFormulario = tipo;
          this.mostrarModalTipo = false;
          this.exito = tipo === 'solicitud_acceso'
            ? 'Formulario de solicitud de acceso asignado'
            : 'Formulario personalizado configurado';
          setTimeout(() => this.exito = '', 3000);
        } else {
          this.error = response.message || 'Error al guardar tipo';
        }
        this.guardandoTipo = false;
      },
      error: () => {
        this.error = 'Error al guardar tipo de formulario';
        this.guardandoTipo = false;
      }
    });
  }

  cambiarTipoFormulario(): void {
    this.mostrarModalTipo = true;
  }

  limpiarSeleccion(): void {
    this.preguntaSeleccionada = null;
    this.terminoBusqueda = '';
    this.resultadosBusqueda = [];
    this.tipoFormulario = null;
    this.mostrarModalTipo = false;
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
    this.pedirConfirmacion(
      `¿Eliminar el campo "${campo.etiqueta}"? Esta acción no se puede deshacer.`,
      () => {
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
    );
  }

  pedirConfirmacion(texto: string, accion: () => void): void {
    this.textoConfirmar = texto;
    this.accionConfirmar = accion;
    this.mostrarModalConfirmar = true;
  }

  ejecutarConfirmacion(): void {
    if (this.accionConfirmar) this.accionConfirmar();
    this.cancelarConfirmacion();
  }

  cancelarConfirmacion(): void {
    this.mostrarModalConfirmar = false;
    this.textoConfirmar = '';
    this.accionConfirmar = null;
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

  get camposVisiblesEnPreview(): FormularioCampo[] {
    return this.camposOrdenados.filter(c => c.visible !== false);
  }

  agregarOpcionNueva(): void {
    const texto = this.opcionNuevaTexto.trim();
    if (!texto) return;
    if (!this.nuevoCampo.opciones) this.nuevoCampo.opciones = [];
    (this.nuevoCampo.opciones as string[]).push(texto);
    this.opcionNuevaTexto = '';
  }

  onOpcionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.agregarOpcionNueva();
    }
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

  resaltarTermino(texto: string): string {
    if (!this.terminoBusqueda || this.terminoBusqueda.trim().length < 2) return texto;
    const escaped = this.terminoBusqueda.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return texto.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="highlight-term">$1</mark>');
  }

  getDescripcionTipo(valor: string): string {
    return this.tiposCampo.find(t => t.valor === valor)?.descripcion || '';
  }
}
