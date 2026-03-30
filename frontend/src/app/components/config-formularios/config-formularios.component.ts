import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoriaService, Modulo } from '../../services/categoria.service';
import { FormularioCampoService, FormularioCampo } from '../../services/formulario-campo.service';
import { FormularioConfigService } from '../../services/formulario-config.service';
import { FormularioTemplateService, FormularioTemplate } from '../../services/formulario-template.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface ModuloConfig {
  modulo_id: number;
  modulo_nombre: string;
  origenModuloId?: number;
  camposPersonalizados?: FormularioCampo[];
}

@Component({
  selector: 'app-config-formularios',
  standalone: true,
  imports: [FormsModule, CommonModule, DragDropModule],
  templateUrl: './config-formularios.component.html',
  styleUrls: ['./config-formularios.component.css']
})
export class ConfigFormulariosComponent implements OnInit {
  configuraciones: ModuloConfig[] = [];
  configuracionesFiltradas: ModuloConfig[] = [];
  modulosCompletos: Modulo[] = [];
  templates: FormularioTemplate[] = [];
  terminoBusqueda: string = '';
  cargando: boolean = false;
  error: string = '';
  exito: string = '';

  // Campos personalizados
  moduloActual: ModuloConfig | null = null;
  mostrarModalCampo: boolean = false;
  campoEditando: FormularioCampo | null = null;
  nuevoCampo: Partial<FormularioCampo> = this.inicializarCampo();
  
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

  plantillaSeleccionada: string | null = null;
  plantillasSeleccionadas: Set<string> = new Set();
  guardandoPlantillas: boolean = false;

  camposPredefinidos = [
    { key: 'nombre_completo', nombre_campo: 'nombre_completo', etiqueta: 'Nombre Completo', tipo: 'text', placeholder: 'Ingrese su nombre completo', tamano_columna: 6, icono: '👤' },
    { key: 'tipo_identificacion', nombre_campo: 'tipo_identificacion', etiqueta: 'Tipo de Identificación', tipo: 'select', opciones: ['CC', 'CE', 'TI', 'NIT', 'Pasaporte'], tamano_columna: 6, icono: '🪪' },
    { key: 'cedula', nombre_campo: 'cedula', etiqueta: 'Número de Documento', tipo: 'text', placeholder: 'Ingrese su número de documento', tamano_columna: 6, icono: '🔢' },
    { key: 'correo', nombre_campo: 'correo', etiqueta: 'Correo Electrónico', tipo: 'email', placeholder: 'ejemplo@correo.com', tamano_columna: 6, icono: '📧' },
    { key: 'numero_contrato', nombre_campo: 'numero_contrato', etiqueta: 'Número de Contrato', tipo: 'text', placeholder: 'Ingrese el número de contrato', tamano_columna: 6, icono: '📄' },
    { key: 'plataforma', nombre_campo: 'plataforma', etiqueta: 'Plataforma', tipo: 'text', placeholder: 'Nombre de la plataforma', tamano_columna: 6, icono: '💻' },
    { key: 'modulo', nombre_campo: 'modulo', etiqueta: 'Módulo', tipo: 'text', placeholder: 'Nombre del módulo', tamano_columna: 6, icono: '📦' },
    { key: 'pregunta', nombre_campo: 'pregunta', etiqueta: 'Pregunta', tipo: 'text', placeholder: 'Escriba su pregunta', tamano_columna: 12, icono: '❓' },
    { key: 'descripcion', nombre_campo: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea', placeholder: 'Describa su problema detalladamente', tamano_columna: 12, icono: '📝' },
    { key: 'error_screenshot', nombre_campo: 'error_screenshot', etiqueta: 'Captura de Error', tipo: 'file', descripcion_ayuda: 'Adjunte una captura de pantalla del error', tamano_columna: 12, icono: '📸' },
    { key: 'fecha_hora', nombre_campo: 'fecha', etiqueta: 'Fecha y Hora', tipo: 'datetime-local', tamano_columna: 6, icono: '🕐' },
    { key: 'fecha', nombre_campo: 'fecha', etiqueta: 'Fecha', tipo: 'date', tamano_columna: 6, icono: '📅' },
    { key: 'numero_inventario', nombre_campo: 'numero_inventario', etiqueta: 'Número de Inventario', tipo: 'number', placeholder: 'Ingrese el número de inventario', tamano_columna: 6, icono: '🏷️' },
    { key: 'contacto', nombre_campo: 'contacto', etiqueta: 'Contacto', tipo: 'number', placeholder: 'Número de contacto', tamano_columna: 6, icono: '📞' },
    { key: 'productora', nombre_campo: 'productora', etiqueta: 'Productora', tipo: 'text', placeholder: 'Nombre de la productora', tamano_columna: 6, icono: '🎬' },
    { key: 'tipo_persona', nombre_campo: 'tipo_persona', etiqueta: 'Tipo de Persona', tipo: 'select', opciones: ['Natural', 'Jurídica'], tamano_columna: 6, icono: '🏢' },
    { key: 'usuario', nombre_campo: 'usuario', etiqueta: 'Usuario', tipo: 'text', placeholder: 'Nombre de usuario', tamano_columna: 6, icono: '🙍' },
    { key: 'programa', nombre_campo: 'programa', etiqueta: 'Programa', tipo: 'text', placeholder: 'Nombre del programa', tamano_columna: 6, icono: '📚' },
    { key: 'rol', nombre_campo: 'rol', etiqueta: 'Rol', tipo: 'text', placeholder: 'Rol del usuario', tamano_columna: 6, icono: '🎭' },
    { key: 'actividad', nombre_campo: 'actividad', etiqueta: 'Actividad', tipo: 'text', placeholder: 'Descripción de la actividad', tamano_columna: 6, icono: '⚡' },
  ];

  constructor(
    private categoriaService: CategoriaService,
    private formularioCampoService: FormularioCampoService,
    private formularioConfigService: FormularioConfigService,
    private formularioTemplateService: FormularioTemplateService
  ) {}

  ngOnInit(): void {
    this.cargarModulos();
    this.cargarTemplates();
  }

  cargarTemplates(): void {
    this.formularioTemplateService.getAll().subscribe({
      next: (r) => {
        if (r.success) {
          this.templates = r.formularios || [];
          // Re-filtrar si ya hay un término de búsqueda activo
          if (this.terminoBusqueda?.trim()) {
            this.filtrarModulos();
          }
        }
      },
      error: (err) => console.error('Error al cargar templates:', err)
    });
  }

  cargarModulos(): void {
    this.categoriaService.getModulos().subscribe({
      next: (modulos) => {
        this.modulosCompletos = modulos;
        // Re-filtrar si ya hay un término de búsqueda activo
        if (this.terminoBusqueda?.trim()) {
          this.filtrarModulos();
        }
      },
      error: (err) => {
        console.error('Error al cargar módulos:', err);
      }
    });
  }

  cargarModulosConPreguntas(): void {
    this.cargando = true;
    this.error = '';

    // Obtener solo módulos con preguntas (filtrado en backend)
    this.formularioConfigService.listarTodos().subscribe({
      next: (response) => {
        if (response.success && response.configuraciones) {
          // Mapear configuraciones del backend
          this.configuraciones = response.configuraciones.map(config => ({
            modulo_id: config.modulo_id,
            modulo_nombre: config.modulo_nombre,
            camposPersonalizados: []
          }));

          // Cargar campos personalizados para cada módulo
          if (this.configuraciones.length > 0) {
            const camposObservables = this.configuraciones.map(config => 
              this.formularioCampoService.getPorModulo(config.modulo_id, true).pipe(
                map(resp => ({
                  modulo_id: config.modulo_id,
                  campos: resp.success ? (resp.campos || []) : []
                })),
                catchError(err => {
                  console.error(`Error al cargar campos del módulo ${config.modulo_id}:`, err);
                  return of({ modulo_id: config.modulo_id, campos: [] });
                })
              )
            );

            forkJoin(camposObservables).subscribe({
              next: (resultados) => {
                // Asignar campos a cada configuración
                resultados.forEach(resultado => {
                  const config = this.configuraciones.find(c => c.modulo_id === resultado.modulo_id);
                  if (config) {
                    config.camposPersonalizados = resultado.campos;
                  }
                });
                
                // Forzar detección de cambios
                this.configuraciones = [...this.configuraciones];
                this.cargando = false;
                // Filtrar inmediatamente con el término actual
                this.filtrarModulos();
                console.log('Módulos con preguntas y campos cargados:', this.configuraciones);
              },
              error: (err) => {
                console.error('Error al cargar campos personalizados:', err);
                this.cargando = false;
              }
            });
          } else {
            this.cargando = false;
          }
        } else {
          this.configuraciones = [];
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar módulos con preguntas:', err);
        this.error = 'Error al cargar módulos con preguntas';
        this.cargando = false;
      }
    });
  }

  filtrarModulos(): void {
    if (!this.terminoBusqueda?.trim()) {
      this.configuracionesFiltradas = [];
      return;
    }

    // Esperar a que ambos recursos estén cargados
    if (!this.modulosCompletos.length || !this.templates.length) {
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    const resultado: ModuloConfig[] = [];

    for (const modulo of this.modulosCompletos) {
      if (!modulo.nombre.toLowerCase().includes(termino)) continue;

      const herencia = this.encontrarTemplateConHerencia(Number(modulo.id));
      if (!herencia) continue; // No tiene formulario en ningún ancestro

      const isDirect = herencia.origenModuloId === Number(modulo.id);
      const template = this.templates.find(t => t.id === herencia.templateId);

      resultado.push({
        modulo_id: Number(modulo.id),
        modulo_nombre: modulo.nombre,
        origenModuloId: herencia.origenModuloId,
        camposPersonalizados: isDirect ? ((template?.campos as any[]) || []) : []
      });
    }

    this.configuracionesFiltradas = resultado;
  }

  /**
   * Busca el template que aplica a un módulo con herencia jerárquica.
   * Sube por idpadre hasta encontrar uno. Retorna { templateId, origenModuloId } o null.
   */
  encontrarTemplateConHerencia(moduloId: number): { templateId: number; origenModuloId: number } | null {
    // Construir mapa moduloId => templateId a partir de los templates cargados
    const byModulo = new Map<number, number>();
    for (const t of this.templates) {
      if (!t.activo) continue;
      for (const id of (t.modulos_asignados || [])) {
        byModulo.set(Number(id), t.id!);
      }
    }

    const byId = new Map<number, Modulo>();
    this.modulosCompletos.forEach(m => byId.set(Number(m.id), m));

    let current: number | null = moduloId;
    while (current != null) {
      if (byModulo.has(current)) {
        return { templateId: byModulo.get(current)!, origenModuloId: current };
      }
      const mod = byId.get(current);
      current = mod?.idpadre ? Number(mod.idpadre) : null;
    }
    return null;
  }

  /**
   * Retorna el nombre de un módulo por su ID.
   */
  getNombreModulo(id: number): string {
    return this.modulosCompletos.find(m => Number(m.id) === id)?.nombre ?? String(id);
  }

  /**
   * Construye la ruta de módulos para mostrar como badges.
   * Cuando origenModuloId != idModulo, el badge del ancestro origen se marca como heredado.
   */
  getRutaModulos(idModulo: number, origenModuloId?: number): { nombre: string; esOrigen: boolean }[] {
    if (!idModulo || !this.modulosCompletos?.length) {
      return [];
    }

    const byId = new Map<number, Modulo>();
    this.modulosCompletos.forEach(m => byId.set(Number(m.id), m));

    const ids: number[] = [];
    let actual = byId.get(Number(idModulo));
    while (actual) {
      ids.unshift(Number(actual.id));
      if (!actual.idpadre) break;
      actual = byId.get(Number(actual.idpadre));
    }

    // Convertir IDs a nombres con flag de herencia
    const nombres = ids.map(id => byId.get(id)?.nombre ?? String(id));

    // Si la ruta tiene 2 elementos (Categoría + Módulo nivel 1), solo mostrar el módulo
    const rutaFinal = nombres.length === 2 ? nombres.slice(1) : nombres;
    const idsFinal  = ids.length === 2      ? ids.slice(1)     : ids;

    return rutaFinal.map((nombre, i) => ({
      nombre,
      // Es origen heredado solo si hay origenModuloId, es distinto del módulo actual, y coincide
      esOrigen: origenModuloId !== undefined
               && origenModuloId !== idModulo
               && idsFinal[i] === origenModuloId
    }));
  }

  // ========== CAMPOS PERSONALIZADOS ==========

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

  cargarCamposPersonalizados(moduloConfig: ModuloConfig): void {
    this.formularioCampoService.getPorModulo(moduloConfig.modulo_id, true).subscribe({
      next: (response) => {
        if (response.success) {
          moduloConfig.camposPersonalizados = response.campos || [];
        }
      },
      error: (err) => {
        console.error('Error al cargar campos personalizados:', err);
      }
    });
  }

  abrirModalAgregarCampo(moduloConfig: ModuloConfig): void {
    this.moduloActual = moduloConfig;
    this.campoEditando = null;
    this.nuevoCampo = this.inicializarCampo();
    this.plantillaSeleccionada = null;
    this.plantillasSeleccionadas = new Set();
    this.mostrarModalCampo = true;
  }

  togglePlantilla(plantilla: any): void {
    if (this.plantillasSeleccionadas.has(plantilla.key)) {
      this.plantillasSeleccionadas.delete(plantilla.key);
    } else {
      this.plantillasSeleccionadas.add(plantilla.key);
    }
  }

  guardarSeleccionados(): void {
    if (!this.moduloActual || this.plantillasSeleccionadas.size === 0) return;
    this.guardandoPlantillas = true;

    const seleccionados = this.camposPredefinidos.filter(p =>
      this.plantillasSeleccionadas.has(p.key)
    );

    const moduloRef = this.moduloActual;
    let completados = 0;
    let errores = 0;

    seleccionados.forEach(plantilla => {
      const campoData: any = {
        modulo_id: moduloRef.modulo_id,
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
          this.checkPlantillasCompletas(completados, seleccionados.length, errores, moduloRef);
        },
        error: () => {
          completados++;
          errores++;
          this.checkPlantillasCompletas(completados, seleccionados.length, errores, moduloRef);
        }
      });
    });
  }

  private checkPlantillasCompletas(completados: number, total: number, errores: number, moduloRef: ModuloConfig): void {
    if (completados < total) return;
    this.guardandoPlantillas = false;

    if (errores === 0) {
      this.exito = `${total} campo(s) agregados exitosamente`;
    } else {
      this.exito = `${total - errores} de ${total} campos agregados`;
      if (errores > 0) this.error = `${errores} campo(s) no se pudieron crear`;
    }

    // Recargar templates para reflejar posible nuevo template creado por herencia rota
    this.cargarTemplates();

    this.formularioCampoService.getPorModulo(moduloRef.modulo_id, true).subscribe({
      next: (resp) => {
        if (resp.success) {
          moduloRef.camposPersonalizados = resp.campos || [];
          moduloRef.origenModuloId = resp.origen_modulo_id ?? moduloRef.modulo_id;
          const index = this.configuraciones.findIndex(c => c.modulo_id === moduloRef.modulo_id);
          if (index !== -1) {
            this.configuraciones[index] = { ...moduloRef };
          }
          // Actualizar también en configuracionesFiltradas
          const fi = this.configuracionesFiltradas.findIndex(c => c.modulo_id === moduloRef.modulo_id);
          if (fi !== -1) this.configuracionesFiltradas[fi] = { ...moduloRef };
        }
        this.cerrarModalCampo();
      }
    });
    setTimeout(() => this.exito = '', 3000);
  }

  seleccionarPlantilla(plantilla: any): void {
    this.plantillaSeleccionada = plantilla.key;
    this.nuevoCampo = {
      nombre_campo: plantilla.nombre_campo,
      etiqueta: plantilla.etiqueta,
      tipo: plantilla.tipo,
      placeholder: plantilla.placeholder || '',
      descripcion_ayuda: plantilla.descripcion_ayuda || '',
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

  abrirModalEditarCampo(moduloConfig: ModuloConfig, campo: FormularioCampo): void {
    this.moduloActual = moduloConfig;
    this.campoEditando = campo;
    this.nuevoCampo = { ...campo };
    this.mostrarModalCampo = true;
  }

  cerrarModalCampo(): void {
    this.mostrarModalCampo = false;
    this.moduloActual = null;
    this.campoEditando = null;
    this.nuevoCampo = this.inicializarCampo();
    this.plantillaSeleccionada = null;
    this.plantillasSeleccionadas = new Set();
    this.guardandoPlantillas = false;
  }

  guardarCampo(): void {
    if (!this.moduloActual || !this.nuevoCampo.nombre_campo || !this.nuevoCampo.etiqueta) {
      this.error = 'Por favor completa todos los campos obligatorios';
      return;
    }

    // Validar opciones para select, radio, checkbox
    if (['select', 'radio', 'checkbox'].includes(this.nuevoCampo.tipo!) && !this.nuevoCampo.opciones?.length) {
      this.error = 'Debes agregar al menos una opción para este tipo de campo';
      return;
    }

    if (this.campoEditando) {
      // Actualizar campo existente
      const moduloRef = this.moduloActual;
      this.formularioCampoService.actualizar(this.campoEditando.id!, this.nuevoCampo).subscribe({
        next: (response) => {
          if (response.success) {
            this.exito = 'Campo actualizado exitosamente';
            // Recargar campos antes de cerrar el modal
            console.log('Recargando campos para módulo después de actualizar:', moduloRef!.modulo_id);
            this.formularioCampoService.getPorModulo(moduloRef!.modulo_id, true).subscribe({
              next: (resp) => {
                console.log('Campos recargados después de actualizar:', resp);
                if (resp.success) {
                  moduloRef!.camposPersonalizados = resp.campos || [];
                  
                  // Actualizar la referencia en el array
                  const index = this.configuraciones.findIndex(c => c.modulo_id === moduloRef!.modulo_id);
                  if (index !== -1) {
                    this.configuraciones[index] = { ...moduloRef! };
                    console.log('Configuración actualizada después de edición en índice:', index);
                  }
                }
                this.cerrarModalCampo();
              }
            });
            setTimeout(() => this.exito = '', 3000);
          } else {
            this.error = response.message || 'Error al actualizar campo';
          }
        },
        error: (err) => {
          console.error('Error:', err);
          this.error = 'Error al actualizar el campo';
        }
      });
    } else {
      // Crear nuevo campo
      const moduloRef = this.moduloActual;
      const campoData = {
        ...this.nuevoCampo,
        modulo_id: this.moduloActual.modulo_id
      } as any;

      this.formularioCampoService.crear(campoData).subscribe({
        next: (response) => {
          console.log('Respuesta al crear campo:', response);
          if (response.success) {
            this.exito = 'Campo creado exitosamente';
            // Recargar templates para reflejar posible nuevo template creado por herencia rota
            this.cargarTemplates();
            this.formularioCampoService.getPorModulo(moduloRef!.modulo_id, true).subscribe({
              next: (resp) => {
                if (resp.success) {
                  moduloRef!.camposPersonalizados = resp.campos || [];
                  moduloRef!.origenModuloId = resp.origen_modulo_id ?? moduloRef!.modulo_id;
                  const index = this.configuraciones.findIndex(c => c.modulo_id === moduloRef!.modulo_id);
                  if (index !== -1) this.configuraciones[index] = { ...moduloRef! };
                  const fi = this.configuracionesFiltradas.findIndex(c => c.modulo_id === moduloRef!.modulo_id);
                  if (fi !== -1) this.configuracionesFiltradas[fi] = { ...moduloRef! };
                }
                this.cerrarModalCampo();
              }
            });
            setTimeout(() => this.exito = '', 3000);
          } else {
            this.error = response.message || 'Error al crear campo';
          }
        },
        error: (err) => {
          console.error('Error:', err);
          this.error = 'Error al crear el campo';
        }
      });
    }
  }

  eliminarCampo(moduloConfig: ModuloConfig, campo: FormularioCampo): void {
    if (!confirm(`¿Estás seguro de eliminar el campo "${campo.etiqueta}"?`)) {
      return;
    }

    this.formularioCampoService.eliminar(campo.id!).subscribe({
      next: (response) => {
        if (response.success) {
          this.exito = 'Campo eliminado exitosamente';
          // Recargar campos y templates
          this.cargarTemplates();
          this.formularioCampoService.getPorModulo(moduloConfig.modulo_id, true).subscribe({
            next: (resp) => {
              if (resp.success) {
                moduloConfig.camposPersonalizados = resp.campos || [];
                moduloConfig.origenModuloId = resp.origen_modulo_id ?? moduloConfig.modulo_id;
                const index = this.configuraciones.findIndex(c => c.modulo_id === moduloConfig.modulo_id);
                if (index !== -1) this.configuraciones[index] = { ...moduloConfig };
                const fi = this.configuracionesFiltradas.findIndex(c => c.modulo_id === moduloConfig.modulo_id);
                if (fi !== -1) this.configuracionesFiltradas[fi] = { ...moduloConfig };
              }
            }
          });
          setTimeout(() => this.exito = '', 3000);
        } else {
          this.error = response.message || 'Error al eliminar campo';
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.error = 'Error al eliminar el campo';
      }
    });
  }

  toggleVisibilidadCampo(moduloConfig: ModuloConfig, campo: FormularioCampo): void {
    const estadoAnterior = campo.visible;
    const nuevoEstadoVisible = !campo.visible;
    
    // Actualizar UI inmediatamente (optimistic update)
    campo.visible = nuevoEstadoVisible;
    
    this.formularioCampoService.actualizar(campo.id!, { visible: nuevoEstadoVisible }).subscribe({
      next: (response) => {
        if (response.success) {
          // Confirmar con el valor del backend si viene
          if (response.campo && typeof response.campo.visible === 'boolean') {
            campo.visible = response.campo.visible;
          }
          this.exito = `Campo ${campo.visible ? 'visible' : 'oculto'} exitosamente`;
          setTimeout(() => this.exito = '', 3000);
        } else {
          // Revertir si no fue exitoso
          campo.visible = estadoAnterior;
          this.error = response.message || 'Error al actualizar visibilidad';
          setTimeout(() => this.error = '', 5000);
        }
      },
      error: (err) => {
        // Revertir en caso de error
        campo.visible = estadoAnterior;
        console.error('Error al actualizar visibilidad:', err);
        this.error = 'Error al actualizar visibilidad del campo';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  onDropCampo(event: CdkDragDrop<FormularioCampo[]>, moduloConfig: ModuloConfig): void {
    const campos = moduloConfig.camposPersonalizados;
    if (!campos || event.previousIndex === event.currentIndex) return;

    moveItemInArray(campos, event.previousIndex, event.currentIndex);

    const ordenData = campos.map((c, i) => ({ id: c.id!, orden: i }));
    this.formularioCampoService.reordenar(ordenData).subscribe({
      next: (response) => {
        if (response.success) {
          moduloConfig.camposPersonalizados = [...campos];
          const idx = this.configuraciones.findIndex(c => c.modulo_id === moduloConfig.modulo_id);
          if (idx !== -1) {
            this.configuraciones[idx] = { ...moduloConfig };
          }
        } else {
          this.error = 'Error al reordenar campos';
        }
      },
      error: () => this.error = 'Error al reordenar campos'
    });
  }

  moverCampo(moduloConfig: ModuloConfig, index: number, direccion: number): void {
    const campos = moduloConfig.camposPersonalizados;
    if (!campos) return;

    const nuevoIndex = index + direccion;
    if (nuevoIndex < 0 || nuevoIndex >= campos.length) return;

    // Intercambiar posiciones en el array local
    [campos[index], campos[nuevoIndex]] = [campos[nuevoIndex], campos[index]];

    // Preparar datos de orden para el backend
    const ordenData = campos.map((c, i) => ({ id: c.id!, orden: i }));

    this.formularioCampoService.reordenar(ordenData).subscribe({
      next: (response) => {
        if (response.success) {
          // Actualizar la referencia para detección de cambios
          moduloConfig.camposPersonalizados = [...campos];
          const idx = this.configuraciones.findIndex(c => c.modulo_id === moduloConfig.modulo_id);
          if (idx !== -1) {
            this.configuraciones[idx] = { ...moduloConfig };
          }
        } else {
          // Revertir si falla
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

  agregarOpcion(): void {
    if (!this.nuevoCampo.opciones) {
      this.nuevoCampo.opciones = [];
    }
    this.nuevoCampo.opciones.push('');
  }

  eliminarOpcion(index: number): void {
    this.nuevoCampo.opciones?.splice(index, 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  requiereOpciones(tipo: string): boolean {
    return ['select', 'radio', 'checkbox'].includes(tipo);
  }

  getTipoLabel(tipo: string): string {
    const tipoEncontrado = this.tiposCampo.find(t => t.valor === tipo);
    return tipoEncontrado ? tipoEncontrado.label : tipo;
  }
}
