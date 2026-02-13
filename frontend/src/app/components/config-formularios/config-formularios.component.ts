import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService, Modulo } from '../../services/categoria.service';
import { FormularioCampoService, FormularioCampo } from '../../services/formulario-campo.service';
import { FormularioConfigService } from '../../services/formulario-config.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface ModuloConfig {
  modulo_id: number;
  modulo_nombre: string;
  camposPersonalizados?: FormularioCampo[];
}

@Component({
  selector: 'app-config-formularios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './config-formularios.component.html',
  styleUrls: ['./config-formularios.component.css']
})
export class ConfigFormulariosComponent implements OnInit {
  configuraciones: ModuloConfig[] = [];
  configuracionesFiltradas: ModuloConfig[] = [];
  modulosCompletos: Modulo[] = [];
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
    { valor: 'textarea', label: 'Área de Texto' },
    { valor: 'select', label: 'Lista Desplegable' },
    { valor: 'checkbox', label: 'Casilla de Verificación' },
    { valor: 'radio', label: 'Opción Múltiple' },
    { valor: 'file', label: 'Archivo' }
  ];

  constructor(
    private categoriaService: CategoriaService,
    private formularioCampoService: FormularioCampoService,
    private formularioConfigService: FormularioConfigService
  ) {}

  ngOnInit(): void {
    this.cargarModulos();
    // No cargar formularios hasta que el usuario busque
  }

  cargarModulos(): void {
    this.categoriaService.getModulos().subscribe({
      next: (modulos) => {
        this.modulosCompletos = modulos;
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
              this.formularioCampoService.getPorModulo(config.modulo_id).pipe(
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
    if (!this.terminoBusqueda || this.terminoBusqueda.trim() === '') {
      // Si no hay término de búsqueda, no mostrar nada
      this.configuracionesFiltradas = [];
      return;
    }

    // Si hay datos cargados, filtrar
    if (this.configuraciones.length > 0) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      this.configuracionesFiltradas = this.configuraciones.filter(config =>
        config.modulo_nombre.toLowerCase().includes(termino)
      );
    } else {
      // Si no hay datos cargados, cargarlos primero
      this.cargarModulosConPreguntas();
    }
  }


  /**
   * Obtiene la ruta de módulos según la profundidad:
   * - Nivel 1: muestra solo el módulo ['PACO']
   * - Nivel 2+: muestra ruta completa ['MISIONALES', 'LIBRO AL VIENTO', 'PROGRAMA']
   */
  getRutaModulos(idModulo: number): string[] {
    if (!idModulo || !this.modulosCompletos?.length) {
      return [];
    }

    const byId = new Map<number, Modulo>();
    this.modulosCompletos.forEach(m => byId.set(Number(m.id), m));

    const rutaCompleta: string[] = [];
    let actual = byId.get(Number(idModulo));

    while (actual) {
      rutaCompleta.unshift(actual.nombre);
      
      if (!actual.idpadre) {
        break;
      }
      
      actual = byId.get(Number(actual.idpadre));
    }

    // Si la ruta tiene 2 elementos (Categoría + Módulo nivel 1), solo mostrar el módulo
    if (rutaCompleta.length === 2) {
      return [rutaCompleta[1]];
    }

    // Si tiene 3+ elementos, mostrar toda la ruta
    return rutaCompleta;
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
    this.formularioCampoService.getPorModulo(moduloConfig.modulo_id).subscribe({
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
    this.mostrarModalCampo = true;
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
            this.formularioCampoService.getPorModulo(moduloRef!.modulo_id).subscribe({
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
            // Recargar campos antes de cerrar el modal
            console.log('Recargando campos para módulo:', moduloRef!.modulo_id);
            this.formularioCampoService.getPorModulo(moduloRef!.modulo_id).subscribe({
              next: (resp) => {
                console.log('Campos recargados después de crear:', resp);
                if (resp.success) {
                  moduloRef!.camposPersonalizados = resp.campos || [];
                  
                  // Actualizar la referencia en el array
                  const index = this.configuraciones.findIndex(c => c.modulo_id === moduloRef!.modulo_id);
                  if (index !== -1) {
                    this.configuraciones[index] = { ...moduloRef! };
                    console.log('Configuración actualizada en índice:', index, this.configuraciones[index]);
                  }
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
        console.log('Respuesta al eliminar campo:', response);
        if (response.success) {
          this.exito = 'Campo eliminado exitosamente';
          
          // Recargar campos después de eliminar
          console.log('Recargando campos para módulo después de eliminar:', moduloConfig.modulo_id);
          this.formularioCampoService.getPorModulo(moduloConfig.modulo_id).subscribe({
            next: (resp) => {
              console.log('Campos recargados después de eliminar:', resp);
              if (resp.success) {
                moduloConfig.camposPersonalizados = resp.campos || [];
                
                // Actualizar la referencia en el array
                const index = this.configuraciones.findIndex(c => c.modulo_id === moduloConfig.modulo_id);
                if (index !== -1) {
                  this.configuraciones[index] = { ...moduloConfig };
                  console.log('Configuración actualizada después de eliminar en índice:', index);
                }
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
    const nuevoEstadoVisible = !campo.visible;
    
    this.formularioCampoService.actualizar(campo.id!, { visible: nuevoEstadoVisible }).subscribe({
      next: (response) => {
        if (response.success) {
          campo.visible = nuevoEstadoVisible;
          this.exito = `Campo ${nuevoEstadoVisible ? 'mostrado' : 'ocultado'} exitosamente`;
          
          // Actualizar la referencia del módulo para forzar detección de cambios
          const index = this.configuraciones.findIndex(c => c.modulo_id === moduloConfig.modulo_id);
          if (index !== -1) {
            this.configuraciones[index] = { ...moduloConfig };
          }
          
          setTimeout(() => this.exito = '', 3000);
        } else {
          this.error = response.message || 'Error al actualizar visibilidad';
        }
      },
      error: (err) => {
        console.error('Error al actualizar visibilidad:', err);
        this.error = 'Error al actualizar visibilidad del campo';
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
