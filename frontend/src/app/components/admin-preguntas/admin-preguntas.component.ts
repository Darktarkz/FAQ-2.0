import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule, QuillEditorComponent } from 'ngx-quill';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PreguntaService, Pregunta } from '../../services/pregunta.service';
import { CategoriaService, Modulo } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-preguntas',
  standalone: true,
  imports: [FormsModule, CommonModule, QuillModule],
  template: `
    <div class="admin-preguntas">
      <div class="page-header">
        <h2>Consulta de Preguntas</h2>
        <p class="subtitle">Busca y administra las preguntas frecuentes de la plataforma</p>
      </div>

      <!-- Sección de Filtros/Búsqueda -->
      <div class="filter-section">
        <h3 class="section-title">🔍 Filtros de Búsqueda</h3>
        <div class="filter-form">
          <div class="form-group">
            <label>Categoría:</label>
            <select [(ngModel)]="filtros.categoria" (change)="onCategoriaChange()" name="categoria">
              <option [value]="null">Selecciona una categoría...</option>
              <option *ngFor="let cat of categorias" [value]="cat.id">
                {{ cat.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group" *ngIf="modulos.length > 0">
            <label>Módulo:</label>
            <select [(ngModel)]="filtros.modulo" (change)="onModuloChange()" name="modulo">
              <option [value]="null">Todos los módulos</option>
              <option *ngFor="let mod of modulos" [value]="mod.id">
                {{ mod.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group" *ngIf="submodulos.length > 0">
            <label>Submódulo:</label>
            <select [(ngModel)]="filtros.submodulo" (change)="onSubmoduloChange()" name="submodulo">
              <option [value]="null">Todos los submódulos</option>
              <option *ngFor="let sub of submodulos" [value]="sub.id">
                {{ sub.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group" *ngIf="subsubmodulos.length > 0">
            <label>Otros Submódulos:</label>
            <select [(ngModel)]="filtros.subsubmodulo" (change)="onSubSubmoduloChange()" name="subsubmodulo">
              <option [value]="null">Todos</option>
              <option *ngFor="let subsub of subsubmodulos" [value]="subsub.id">
                {{ subsub.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group" *ngIf="subsubsubmodulos.length > 0">
            <label>Detalle:</label>
            <select [(ngModel)]="filtros.subsubsubmodulo" name="subsubsubmodulo">
              <option [value]="null">Todos</option>
              <option *ngFor="let subsubsub of subsubsubmodulos" [value]="subsubsub.id">
                {{ subsubsub.nombre }}
              </option>
            </select>
          </div>

          <div class="filter-actions">
            <button class="btn-consultar" (click)="buscarPreguntas()">
              <span>🔎</span> Consultar
            </button>
            <button class="btn-limpiar" (click)="limpiarFiltros()">
              <span>↻</span> Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Sección de Resultados -->
      <div class="results-section">
        <div class="results-header">
          <div class="header-info">
            <h3>📋 Resultados de la Búsqueda</h3>
            <span class="count-badge">{{ preguntasFiltradas.length }} pregunta(s)</span>
          </div>
          <div class="header-actions">
            <button *ngIf="false" class="btn-clean-numbers" (click)="previsualizarLimpiezaNumeros()" title="Eliminar números del inicio de las preguntas">
              <span>🔢</span> Limpiar Números
            </button>
            <button 
              *ngIf="preguntasFiltradas.length > 0" 
              class="btn-reorder" 
              [class.active]="modoReorden"
              (click)="toggleModoReorden()"
              title="Reordenar preguntas">
              {{ modoReorden ? '✓ Guardar Orden' : '↕️ Reordenar' }}
            </button>
            <button class="btn-add-question" (click)="abrirAgregar()">
              <span>➕</span> Agregar Nueva Pregunta
            </button>
          </div>
        </div>

        <div *ngIf="preguntasFiltradas.length === 0 && consultaRealizada" class="no-results">
          <span class="no-results-icon">📋</span>
          <p>No hay preguntas que coincidan con los filtros seleccionados</p>
          <small>Intenta seleccionar diferentes filtros o clickea "Limpiar Filtros"</small>
        </div>

        <div *ngIf="!consultaRealizada" class="no-results">
          <span class="no-results-icon">🔍</span>
          <p>Selecciona los filtros y haz clic en "Consultar" para buscar preguntas</p>
        </div>

        <div *ngIf="preguntasFiltradas.length > 0" class="preguntas-lista">
          <div 
            *ngFor="let pregunta of preguntasFiltradas; let i = index" 
            class="pregunta-item"
            [class.dragging]="draggedIndex === i"
            [class.drag-mode]="modoReorden"
            [draggable]="modoReorden"
            (dragstart)="onDragStart($event, i)"
            (dragend)="onDragEnd($event)"
            (dragover)="onDragOver($event, i)"
            (drop)="onDrop($event, i)">
            <div class="pregunta-content">
              <div class="pregunta-header">
                <span class="drag-handle" *ngIf="modoReorden">⋮⋮</span>
                <span class="numero">{{ i + 1 }}.</span>
                <div class="pregunta-meta">
                  <!--<span class="id-badge">ID: {{ pregunta.id || 'N/D' }}</span> -->
                  <span *ngFor="let modulo of getRutaModulos(pregunta?.Idmodulo)" class="app-badge">{{ modulo }}</span> 
                  <!--<span *ngIf="pregunta.Aplicativo" class="app-badge aplicativo-badge">{{ pregunta.Aplicativo }}</span>-->
                </div>
              </div>
              <div class="pregunta-text">
                <strong>P:</strong> {{ pregunta.Pregunta }}
              </div>
              <div class="respuesta-text">
                <strong>R:</strong> <span [innerHTML]="sanitizar(pregunta.Respuesta)"></span>
              </div>
            </div>
            <div class="pregunta-acciones" *ngIf="!modoReorden">
              <button class="btn-edit" (click)="editarPregunta(pregunta)" title="Editar pregunta">
                ✏️ Editar
              </button>
              <button class="btn-delete" (click)="eliminarPregunta(pregunta)" title="Eliminar pregunta">
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Edición/Creación -->
      <div *ngIf="mostrarFormulario" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editandoPregunta ? 'Editar Pregunta' : 'Agregar Nueva Pregunta' }}</h3>
            <button class="btn-close" (click)="cerrarFormulario()">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="guardarPregunta()">
              <div class="form-group">
                <label>Pregunta:</label>
                <textarea 
                  [(ngModel)]="nuevaPregunta.Pregunta" 
                  name="pregunta"
                  required
                ></textarea>
              </div>

              <div class="form-group">
                <label>Respuesta:</label>
                <quill-editor
                  #quillEditor
                  [(ngModel)]="nuevaPregunta.Respuesta"
                  name="respuesta"
                  format="html"
                  [modules]="quillModules"
                  [styles]="{ height: '200px' }"
                  placeholder="Escribe la respuesta aquí..."
                  (onEditorCreated)="onEditorCreated($event)"
                ></quill-editor>
                <small class="help-text">Editor enriquecido: negritas, listas, enlaces y pegar imágenes (Ctrl+V) desde el portapapeles.</small>
                <small class="uploading" *ngIf="subiendoImagen">Subiendo imagen del portapapeles...</small>
              </div>

              <!-- Selects en cascada: Categoría → Módulo → Submódulo → … -->
              <div class="form-group" *ngFor="let nv of modalNiveles; let i = index">
                <label>{{ getLabelNivel(i) }}:</label>
                <select
                  [(ngModel)]="modalSelecciones[i]"
                  [name]="'modal_nivel_' + i"
                  (ngModelChange)="onModalNivelChange(i)"
                >
                  <option [ngValue]="null">Selecciona {{ getLabelNivel(i).toLowerCase() }}...</option>
                  <option *ngFor="let mod of modalNiveles[i]" [value]="mod.id">
                    {{ mod.nombre }}
                  </option>
                </select>
              </div>

                            <div class="form-actions">
                <button type="submit" class="btn-save">{{ editandoPregunta ? 'Actualizar' : 'Guardar' }}</button>
                <button type="button" class="btn-cancel" (click)="cerrarFormulario()">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal de Limpieza de Números -->
      <div *ngIf="mostrarModalLimpieza" class="modal-overlay" (click)="cerrarModalLimpieza()">
        <div class="modal-content modal-limpieza" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>🔢 Limpiar Números de Preguntas</h3>
            <button class="btn-close" (click)="cerrarModalLimpieza()">✕</button>
          </div>
          <div class="modal-body">
            <div *ngIf="cargandoLimpieza" class="loading-state">
              <p>⏳ Analizando preguntas...</p>
            </div>

            <div *ngIf="!cargandoLimpieza && previsualizacionLimpieza">
              <div class="preview-summary">
                <p><strong>Total de preguntas:</strong> {{ previsualizacionLimpieza.total_preguntas }}</p>
                <p><strong>Con números al inicio:</strong> {{ previsualizacionLimpieza.modificadas }}</p>
                <p><strong>Sin cambios:</strong> {{ previsualizacionLimpieza.sin_cambios }}</p>
              </div>

              <div *ngIf="previsualizacionLimpieza.modificadas > 0" class="preview-changes">
                <h4>Vista Previa de Cambios:</h4>
                <div class="changes-list">
                  <div *ngFor="let cambio of previsualizacionLimpieza.detalles_modificadas.slice(0, 10)" class="change-item">
                    <div class="change-before">
                      <strong>Antes:</strong> {{ cambio.original }}
                    </div>
                    <div class="change-after">
                      <strong>Después:</strong> {{ cambio.limpio }}
                    </div>
                  </div>
                  <p *ngIf="previsualizacionLimpieza.detalles_modificadas.length > 10" class="more-changes">
                    ... y {{ previsualizacionLimpieza.detalles_modificadas.length - 10 }} cambios más
                  </p>
                </div>

                <div class="warning-box">
                  <p>⚠️ Esta acción modificará {{ previsualizacionLimpieza.modificadas }} pregunta(s) en la base de datos.</p>
                  <p>Se eliminarán los números del inicio (ej: "1. ", "2.", "15. ") de forma permanente.</p>
                </div>

                <div class="form-actions">
                  <button class="btn-save" (click)="aplicarLimpiezaNumeros()">
                    ✓ Aplicar Cambios
                  </button>
                  <button class="btn-cancel" (click)="cerrarModalLimpieza()">
                    Cancelar
                  </button>
                </div>
              </div>

              <div *ngIf="previsualizacionLimpieza.modificadas === 0" class="no-changes">
                <p>✓ No se encontraron preguntas con números al inicio.</p>
                <p>Todas las preguntas están limpias.</p>
                <button class="btn-cancel" (click)="cerrarModalLimpieza()">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    /* ── Base ── */
    .admin-preguntas {
      max-width: 1400px;
      margin: 0 auto;
      padding: 28px 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      direction: ltr;
      unicode-bidi: isolate;
      writing-mode: horizontal-tb;
      animation: fadeInPage 0.35s ease-out;
    }
    @keyframes fadeInPage {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── ENCABEZADO ── */
    .page-header {
      margin-bottom: 32px;
      padding-left: 16px;
      border-left: 4px solid #667eea;

      h2 {
        margin: 0 0 6px 0;
        color: #1A1A2E;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.5px;
      }

      .subtitle {
        margin: 0;
        color: #8A8FA8;
        font-size: 13px;
        font-weight: 500;
      }
    }

    /* ── SECCIÓN DE FILTROS ── */
    .filter-section {
      background: white;
      padding: 26px 28px;
      border-radius: 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
    }

    .section-title {
      color: black;
      font-size: 15px;
      font-weight: 700;
      margin: 0 0 20px 0;
      letter-spacing: 0.2px;
    }

    .filter-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      display: block;
      margin-bottom: 7px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
    }

    select, input, textarea {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid #DDD8EF;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      background: #FAFAFE;
      color: #1A1A2E;
      transition: all 0.2s ease;

      &:hover { border-color: rgba(255,255,255,0.4); }

      &:focus {
        outline: none;
        border-color: #6C5ECF;
        background: white;
        box-shadow: 0 0 0 3px rgba(108, 94, 207, 0.12);
      }
    }

    textarea {
      min-height: 100px;
      resize: vertical;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
    }

    .filter-actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 12px;
      justify-content: flex-start;
      flex-wrap: wrap;
      margin-top: 6px;
    }

    /* ── BOTONES ── */
    .btn-consultar, .btn-limpiar, .btn-add-question, .btn-edit, .btn-delete,
    .btn-save, .btn-cancel, .btn-close, .btn-reorder, .btn-clean-numbers {
      padding: 10px 20px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;

      span { font-size: 15px; }

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
      }

      &:active { transform: translateY(0); }
    }

    .btn-consultar {
       background: linear-gradient(135deg, #6C5ECF, #9B8AF0);
      color: white;
      box-shadow: 0 3px 10px rgba(108, 94, 207, 0.3);

      &:hover { box-shadow: 0 5px 16px rgba(108, 94, 207, 0.38); }
    }

    .btn-limpiar {
       background: linear-gradient(135deg, #6C5ECF, #9B8AF0);
      color: white;
      box-shadow: 0 3px 10px rgba(108, 94, 207, 0.3);

      &:hover { box-shadow: 0 5px 16px rgba(108, 94, 207, 0.38); }
    }

    .btn-add-question {
      background: linear-gradient(135deg, #43A047, #2E7D32);
      color: white;
      box-shadow: 0 3px 10px rgba(46,125,50,0.3);

      &:hover { box-shadow: 0 6px 18px rgba(46,125,50,0.35); }
    }

    .btn-clean-numbers {
      background: linear-gradient(135deg, #FF9800, #F57C00);
      color: white;
      box-shadow: 0 2px 8px rgba(255,152,0,0.25);

      &:hover { box-shadow: 0 5px 14px rgba(255,152,0,0.35); }
    }

    .btn-reorder {
      background: linear-gradient(135deg, #65558F, #4a3470);
      color: white;
      box-shadow: 0 2px 8px rgba(101,85,143,0.25);

      &:hover { box-shadow: 0 5px 14px rgba(101,85,143,0.35); }

      &.active {
        background: linear-gradient(135deg, #43A047, #2E7D32);
        box-shadow: 0 2px 8px rgba(46,125,50,0.25);
      }
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-edit {
      background: linear-gradient(135deg, #2196F3, #1565C0);
      color: white;
      padding: 7px 15px;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(33,150,243,0.25);

      &:hover { box-shadow: 0 5px 14px rgba(33,150,243,0.35); }
    }

    .btn-delete {
      background: linear-gradient(135deg, #EF5350, #C62828);
      color: white;
      padding: 7px 15px;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(239,83,80,0.25);

      &:hover { box-shadow: 0 5px 14px rgba(239,83,80,0.35); }
    }

    .btn-save {
      background: linear-gradient(135deg, #667eea, #5568d3);
      color: white;
      box-shadow: 0 3px 10px rgba(102,126,234,0.3);

      &:hover { box-shadow: 0 6px 18px rgba(102,126,234,0.38); }
    }

    .btn-cancel {
      background: #F0F0F5;
      color: #5A5A72;

      &:hover { background: #E4E4EE; }
    }

    /* ── SECCIÓN DE RESULTADOS ── */
    .results-section {
      background: white;
      padding: 28px 30px;
      border-radius: 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 26px;
      padding-bottom: 18px;
      border-bottom: 1.5px solid #F0F0F8;

      .header-info {
        display: flex;
        align-items: center;
        gap: 14px;

        h3 {
          margin: 0;
          color: #1A1A2E;
          font-size: 17px;
          font-weight: 700;
        }

        .count-badge {
          background: #EEF0FD;
          color: #667eea;
          padding: 5px 13px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }
      }
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: #8A8FA8;

      .no-results-icon {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
        opacity: 0.7;
      }

      p {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #3D3D5C;
      }

      small {
        display: block;
        color: #B0B5C9;
        font-size: 13px;
      }
    }

    /* ── LISTA DE PREGUNTAS ── */
    .preguntas-lista {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pregunta-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 18px 20px;
      border: 1px solid #EBEBF5;
      border-radius: 16px;
      background: white;
      transition: all 0.25s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      animation: dropAnimation 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.12);
        border-color: #CCCFF5;
      }
    }

    .pregunta-content {
      flex: 1;
      min-width: 0;
    }

    .pregunta-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;

      .numero {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #EEF0FD;
        color: #667eea;
        font-size: 12px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .pregunta-meta {
        display: flex;
        gap: 6px;
        align-items: center;
        flex-wrap: wrap;

        .id-badge {
          background: #F5F5FA;
          color: #8A8FA8;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Monaco', monospace;
        }

        .app-badge {
          background: #EEF0FD;
          color: #667eea;
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .aplicativo-badge {
          background: #E8F5E9;
          color: #2E7D32;
        }
      }
    }

    .pregunta-text, .respuesta-text {
      margin-bottom: 10px;
      line-height: 1.6;
      color: #3D3D5C;
      font-size: 14px;

      strong {
        color: #667eea;
        margin-right: 6px;
        font-weight: 700;
      }
    }

    .respuesta-text {
      color: #6B6B8A;
      font-size: 13px;
      padding: 10px 14px;
      background: #FAFBFF;
      border-radius: 8px;
      border-left: 3px solid #CCCFF5;
      margin-bottom: 0;
      overflow-wrap: break-word;
      word-break: break-word;
      overflow: hidden;
    }

    :host ::ng-deep .respuesta-text p { margin: 0 0 0.3em 0; }
    :host ::ng-deep .respuesta-text p:last-child { margin-bottom: 0; }
    :host ::ng-deep .respuesta-text img { max-width: 100%; height: auto; border-radius: 4px; }
    :host ::ng-deep .respuesta-text .ql-align-center { text-align: center; }
    :host ::ng-deep .respuesta-text .ql-align-right { text-align: right; }
    :host ::ng-deep .respuesta-text .ql-align-justify { text-align: justify; }

    .pregunta-acciones {
      display: flex;
      gap: 8px;
      margin-left: 18px;
      flex-wrap: wrap;
      justify-content: flex-end;
      align-items: flex-start;
    }

    /* ── MODAL ── */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(26, 26, 46, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeInPage 0.2s ease;
    }

    .modal-content {
      background: white;
      border-radius: 18px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.22);
      max-width: 700px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from { transform: translateY(24px) scale(0.97); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }

    .modal-header {
      padding: 22px 26px;
      background: linear-gradient(135deg, #EEF0FD, #E8EBFF);
      border-radius: 18px 18px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #D5D9F5;

      h3 {
        margin: 0;
        color: #1A1A2E;
        font-size: 17px;
        font-weight: 700;
      }

      .btn-close {
        background: rgba(102, 126, 234, 0.1);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        color: #667eea;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover { background: rgba(102, 126, 234, 0.2); }
      }
    }

    .modal-body {
      padding: 26px;

      form {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .form-group {
        display: flex;
        flex-direction: column;

        label {
          display: block;
          margin-bottom: 7px;
          color: #3D3D5C;
          font-weight: 600;
          font-size: 13px;
        }

        input, textarea, select {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #D5D9F5;
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          background: #FAFBFF;
          color: #1A1A2E;
          transition: all 0.2s ease;

          &:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
          }
        }

        textarea { min-height: 100px; resize: vertical; }
      }

      :host ::ng-deep .ql-container {
        border-radius: 0 0 10px 10px;
        font-size: 14px;
        line-height: 1.6;
      }

      :host ::ng-deep .ql-toolbar.ql-snow {
        border-radius: 10px 10px 0 0;
        background: linear-gradient(180deg, #fdfdff 0%, #f4f6fb 100%);
      }

      :host ::ng-deep .ql-editor {
        min-height: 180px;
        background: white;
      }

      :host ::ng-deep .ql-editor img { max-width: 100%; }
      :host ::ng-deep quill-editor { display: block; }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;

        @media (max-width: 600px) { grid-template-columns: 1fr; }
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 8px;
        padding-top: 18px;
        border-top: 1px solid #EEF0FD;
      }
    }

    .help-text {
      display: block;
      margin-top: 6px;
      font-size: 11px;
      color: #8A8FA8;
      font-style: italic;
    }

    .uploading {
      display: block;
      margin-top: 5px;
      font-size: 12px;
      color: #667eea;
      font-weight: 600;
    }

    /* ── MODAL DE LIMPIEZA ── */
    .modal-limpieza { max-width: 800px; }

    .loading-state {
      text-align: center;
      padding: 40px;
      color: #8A8FA8;
      font-size: 16px;
    }

    .preview-summary {
      background: #FAFBFF;
      padding: 18px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;

      p {
        margin: 7px 0;
        font-size: 14px;
        strong { color: #1A1A2E; }
      }
    }

    .preview-changes {
      h4 { color: #1A1A2E; font-size: 15px; margin-bottom: 14px; }
    }

    .changes-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #EBEBF5;
      border-radius: 10px;
      padding: 14px;
      background: #FAFBFF;
      margin-bottom: 18px;
    }

    .change-item {
      padding: 12px;
      margin-bottom: 10px;
      background: white;
      border-radius: 8px;
      border-left: 3px solid #FF9800;

      &:last-child { margin-bottom: 0; }
    }

    .change-before {
      margin-bottom: 7px;
      color: #EF5350;
      font-size: 13px;

      strong { display: inline-block; min-width: 60px; color: #C62828; }
    }

    .change-after {
      color: #43A047;
      font-size: 13px;

      strong { display: inline-block; min-width: 60px; color: #2E7D32; }
    }

    .more-changes {
      text-align: center;
      color: #8A8FA8;
      font-style: italic;
      margin-top: 10px;
      font-size: 13px;
    }

    .warning-box {
      background: #FFF8E1;
      border: 1px solid #FFD54F;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 18px 0;

      p {
        margin: 7px 0;
        color: #795548;
        font-size: 14px;

        &:first-child { font-weight: 600; }
      }
    }

    .no-changes {
      text-align: center;
      padding: 40px 20px;

      p {
        margin: 10px 0;
        font-size: 16px;

        &:first-child { color: #43A047; font-weight: 600; font-size: 18px; }
        &:last-of-type { color: #8A8FA8; font-size: 14px; }
      }

      button { margin-top: 20px; }
    }

    /* ── DRAG AND DROP ── */
    .pregunta-item.drag-mode {
      cursor: grab;
      border: 1.5px solid transparent;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.01);
        box-shadow: 0 6px 24px rgba(102, 126, 234, 0.18);
        border-color: #667eea;
      }
    }

    .pregunta-item.dragging {
      opacity: 0.45;
      transform: rotate(1.5deg) scale(1.01);
    }

    .drag-handle {
      font-size: 20px;
      color: #B0B5C9;
      cursor: grab;
      margin-right: 6px;
      user-select: none;
      line-height: 1;
      padding: 4px 6px;
      border-radius: 6px;
      background: #F0F2FB;
      transition: background 0.2s;

      &:hover { background: #E4E8F8; color: #667eea; }
    }

    @keyframes dropAnimation {
      0%   { transform: scale(1.02); }
      60%  { transform: scale(0.99); }
      100% { transform: scale(1); }
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .filter-form { grid-template-columns: 1fr; }

      .results-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;

        .header-info {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          width: 100%;
          h3 { font-size: 16px; }
        }

        .header-actions {
          width: 100%;
          flex-direction: column;

          button { width: 100%; justify-content: center; }
        }
      }

      .pregunta-item {
        flex-direction: column;

        .pregunta-acciones {
          margin-left: 0;
          margin-top: 14px;
          width: 100%;
          justify-content: flex-start;

          button { flex: 1; justify-content: center; }
        }
      }
    }
  `]
})
export class AdminPreguntasComponent implements OnInit {

  preguntas: Pregunta[] = [];
  categorias: Modulo[] = [];
  modulos: Modulo[] = [];
  submodulos: Modulo[] = [];
  subsubmodulos: Modulo[] = [];
  subsubsubmodulos: Modulo[] = [];
  modulosCompletos: Modulo[] = [];  // Todos los módulos para construir la jerarquía
  modulosParaFormulario: Modulo[] = [];  // Solo módulos donde se pueden crear preguntas
  allowedModuleIds: number[] = [];
  isAdmin = false;

  filtros = {
    categoria: null as number | null,
    modulo: null as number | null,
    submodulo: null as number | null,
    subsubmodulo: null as number | null,
    subsubsubmodulo: null as number | null
  };

  mostrarFormulario = false;
  editandoPregunta = false;

  // Modal: selects en cascada para módulo
  modalNiveles: Modulo[][] = [];
  modalSelecciones: (number | null)[] = [];

  preguntasFiltradas: Pregunta[] = [];
  consultaRealizada = false;

  nuevaPregunta: Pregunta = {
    Pregunta: '',
    Respuesta: '',
    Idmodulo: undefined,
    Aplicativo: undefined
  };

  subiendoImagen = false;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  quillInstance: any = null;

  mostrarModalLimpieza = false;
  cargandoLimpieza = false;
  previsualizacionLimpieza: any = null;

  // Drag and Drop
  modoReorden = false;
  draggedIndex: number | null = null;
  ordenOriginal: Pregunta[] = [];

  @ViewChild('quillEditor') quillEditorComponent?: QuillEditorComponent;

  getPreguntaId(p: any): any {
    return this.resolverIdPregunta(p) ?? p?.id ?? p?.ID ?? p?.Id ?? p?.id_pregunta ?? p?.Id_pregunta ?? p?.IdPreguntas ?? p?.idpreguntas;
  }

  private resolverIdPregunta(p: any): any {
    if (!p) {
      console.warn('No se pudo resolver ID: objeto vacío', p);
      return undefined;
    }

    const canonical = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetKeys = new Set(['id', 'idpregunta', 'idpreguntas']);

    // 1) Chequeo directo con variantes comunes (incluye espacios/trailing) y trim de valores string
    for (const k of Object.keys(p)) {
      if (!Object.prototype.hasOwnProperty.call(p, k)) continue;

      const normalizedKey = canonical(k);
      if (targetKeys.has(normalizedKey)) {
        let val = p[k];
        if (typeof val === 'string') {
          val = val.trim();
        }
        if (val !== undefined && val !== null && val !== '') {
          console.debug('ID resuelto (key normalizada):', k, '→', val);
          return val;
        }
      }
    }

    // 2) Fallback: cualquier llave que contenga "id" y "pregun" en cualquier orden
    const dynamicKey = Object.keys(p).find(k => /id.*pregun|pregun.*id/i.test(k));
    if (dynamicKey) {
      let val = p[dynamicKey];
      if (typeof val === 'string') {
        val = val.trim();
      }
      if (val !== undefined && val !== null && val !== '') {
        console.warn('ID resuelto por fallback', dynamicKey, val);
        return val;
      }
    }

    // 3) Último recurso: si viene anidado en una propiedad singular llamada "pregunta"
    if (p.pregunta && typeof p.pregunta === 'object') {
      const nestedId = this.resolverIdPregunta(p.pregunta);
      if (nestedId !== undefined && nestedId !== null && nestedId !== '') {
        console.warn('ID resuelto desde objeto anidado "pregunta"', nestedId);
        return nestedId;
      }
    }

    console.warn('No se pudo resolver ID para pregunta, keys disponibles:', Object.keys(p));
    return undefined;
  }

  constructor(
    private preguntaService: PreguntaService,
    private categoriaService: CategoriaService,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  onEditorCreated(quill: any) {
    this.quillInstance = quill;

    // Handler personalizado para el botón de imagen del toolbar
    const toolbar = quill.getModule('toolbar');
    toolbar.addHandler('image', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        this.subirImagenAlEditor(quill, file);
      };
    });

    // Interceptar pegado de imágenes
    quill.root.addEventListener('paste', (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imagenItem = Array.from(items).find(item => item.type.startsWith('image/'));
      if (!imagenItem) return;

      const file = imagenItem.getAsFile();
      if (!file) return;

      event.preventDefault();
      event.stopPropagation();
      this.subirImagenAlEditor(quill, file);
    });
  }

  private subirImagenAlEditor(quill: any, file: File) {
    this.subiendoImagen = true;
    this.preguntaService.uploadImagen(file).subscribe({
      next: (resp) => {
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', resp.url);
        quill.setSelection(range.index + 1);
      },
      error: (error: any) => {
        console.error('Error al subir imagen:', error);
        this.toast.error('No se pudo subir la imagen. Verifica el tamaño (máx 10MB) y formato.');
      },
      complete: () => {
        this.subiendoImagen = false;
      }
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    console.log('=== INICIANDO CARGA DE DATOS ===');
    this.isAdmin = this.authService.isAdmin();
    this.allowedModuleIds = this.authService.getAllowedModuleIds();
    
    // Cargar preguntas
    console.log('Llamando a preguntaService.getPreguntas()...');
    this.preguntaService.getPreguntas().subscribe({
      next: (data: any[]) => {
        console.log('✅ Preguntas cargadas exitosamente:', data);
        console.log('Total de preguntas:', data.length);
        const normalizadas = data.map((p: any) => {
          const resolvedId = this.resolverIdPregunta(p);
          let finalId: any = resolvedId;
          if (finalId === undefined || finalId === null || finalId === '') {
            const directId = p.ID ?? p.Id ?? p.id ?? p.id_pregunta ?? p.Id_pregunta ?? p.IdPreguntas ?? p.idpreguntas;
            finalId = directId;
          }
          const parsedId = Number(finalId);
          if (Number.isFinite(parsedId)) {
            finalId = parsedId;
          }

          const rawModulo = p.Idmodulo ?? p.idmodulo ?? p.id_modulo ?? p.IdModulo;
          const parsedModulo = Number(rawModulo);
          const finalModulo = Number.isFinite(parsedModulo) ? parsedModulo : rawModulo;

          const normalizada = {
            ...p,
            id: finalId,
            Idmodulo: finalModulo
          } as Pregunta;

          console.debug('Pregunta normalizada:', normalizada);
          if (normalizada.id === undefined || normalizada.id === null || normalizada.id === 0) {
            console.warn('⚠️ Pregunta sin ID después de normalizar. Keys disponibles:', Object.keys(p));
          }
          return normalizada;
        });
        this.preguntas = this.aplicarPermisosPreguntas(normalizadas);
        // No aplicar filtros automáticamente
      },
      error: (error: any) => {
        console.error('❌ ERROR al cargar preguntas:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
      }
    });

    // Cargar TODOS los módulos para construir la jerarquía
    // (las categorías se derivan de aquí, eliminando la race condition con getCategorias())
    console.log('Llamando a categoriaService.getModulos()...');
    this.categoriaService.getModulos().subscribe({
      next: (data: any[]) => {
        console.log('✅ Todos los módulos cargados:', data);
        // Asegurar que id e idpadre sean números
        // Guardar la lista completa SIN filtrar (igual que admin-modulos)
        // para que la jerarquía de ancestros siempre esté disponible
        this.modulosCompletos = data.map(m => ({
          ...m,
          id: Number(m.id || m.idMODULOS),
          idpadre: m.idpadre ? Number(m.idpadre) : null
        }));
        console.log('Módulos completos guardados con tipos numéricos:', this.modulosCompletos);
        // modulosParaFormulario: solo los módulos donde el usuario puede crear preguntas
        this.modulosParaFormulario = this.aplicarPermisosModulosFormulario(this.modulosCompletos);
        // categorias: derivadas del árbol completo con traversal correcto de ancestros
        this.refrescarCategoriasPermitidas();
      },
      error: (error: any) => {
        console.error('ERROR al cargar todos los módulos:', error);
      }
    });

    // Cargar info de debug
    console.log('Llamando a endpoint de debug...');
    this.preguntaService.getDebugInfo().subscribe({
      next: (data: any) => {
        console.log('=== DEBUG INFO ===');
        console.log('Total de preguntas:', data.total_preguntas);
        console.log('IDs módulo únicos en preguntas:', data.idmodulos_unicos);
        console.log('Conteo por Idmodulo:', data.conteo_por_idmodulo);
      },
      error: (error: any) => {
        console.error('Error al cargar debug info:', error);
      }
    });
  }

  onCategoriaChange() {
    console.log('=== CAMBIO DE CATEGORÍA ===');
    console.log('Categoría seleccionada:', this.filtros.categoria);
    const catSeleccionada = this.categorias.find(c => c.id === this.filtros.categoria);
    console.log('Detalles de categoría:', catSeleccionada);
    
    // Resetear los otros filtros
    this.filtros.modulo = null;
    this.filtros.submodulo = null;
    this.filtros.subsubmodulo = null;
    this.filtros.subsubsubmodulo = null;
    this.modulos = [];
    this.submodulos = [];
    this.subsubmodulos = [];
    this.subsubsubmodulos = [];

    // Cargar los módulos de esta categoría
    if (this.filtros.categoria && this.modulosCompletos.length > 0) {
      const catId = Number(this.filtros.categoria);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === catId);
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      this.modulos = hijos;
      console.log(`Módulos encontrados para categoría ${catId}:`, this.modulos);
    } else if (this.filtros.categoria) {
      console.warn('modulosCompletos está vacío o no cargado');
    }
  }

  onModuloChange() {
    console.log('=== CAMBIO DE MÓDULO ===');
    console.log('Módulo seleccionado:', this.filtros.modulo);
    
    this.filtros.submodulo = null;
    this.filtros.subsubmodulo = null;
    this.filtros.subsubsubmodulo = null;
    this.submodulos = [];
    this.subsubmodulos = [];
    this.subsubsubmodulos = [];

    // Cargar submódulos de este módulo
    if (this.filtros.modulo && this.modulosCompletos.length > 0) {
      const modId = Number(this.filtros.modulo);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === modId);
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      this.submodulos = hijos;
      console.log(`Submódulos encontrados para módulo ${modId}:`, this.submodulos);
    } else if (this.filtros.modulo) {
      console.warn('modulosCompletos está vacío o no cargado');
    }
  }

  onSubmoduloChange() {
    console.log('=== CAMBIO DE SUBMÓDULO ===');
    console.log('Submódulo seleccionado:', this.filtros.submodulo);
    
    this.filtros.subsubmodulo = null;
    this.filtros.subsubsubmodulo = null;
    this.subsubmodulos = [];
    this.subsubsubmodulos = [];

    // Cargar sub-submódulos de este submódulo
    if (this.filtros.submodulo && this.modulosCompletos.length > 0) {
      const submId = Number(this.filtros.submodulo);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === submId);
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      this.subsubmodulos = hijos;
      console.log(`Sub-submódulos encontrados para submódulo ${submId}:`, this.subsubmodulos);
    } else if (this.filtros.submodulo) {
      console.warn('modulosCompletos está vacío o no cargado');
    }
  }

  onSubSubmoduloChange() {
    console.log('=== CAMBIO DE SUB-SUBMÓDULO ===');
    console.log('Sub-submódulo seleccionado:', this.filtros.subsubmodulo);
    
    this.filtros.subsubsubmodulo = null;
    this.subsubsubmodulos = [];

    // Cargar sub-sub-submódulos de este sub-submódulo
    if (this.filtros.subsubmodulo && this.modulosCompletos.length > 0) {
      const subsubId = Number(this.filtros.subsubmodulo);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === subsubId);
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      this.subsubsubmodulos = hijos;
      console.log(`Sub-sub-submódulos encontrados para sub-submódulo ${subsubId}:`, this.subsubsubmodulos);
    } else if (this.filtros.subsubmodulo) {
      console.warn('modulosCompletos está vacío o no cargado');
    }
  }

  buscarPreguntas() {
    console.log('=== BUSCANDO CON FILTROS ===');
    console.log('Filtros seleccionados:', this.filtros);
    
    this.consultaRealizada = true;
    
    if (this.filtros.categoria) {
      const cat = this.categorias.find(c => c.id === this.filtros.categoria);
      console.log('Categoría seleccionada:', cat);
    }
    
    console.log('Primeras 5 preguntas y sus Idmodulo:');
    this.preguntas.slice(0, 5).forEach((p, i) => {
      console.log(`  Pregunta ${i+1}: ID=${p.id}, Idmodulo=${p.Idmodulo}, Pregunta="${p.Pregunta?.substring(0, 50)}..."`);
    });
    
    this.aplicarFiltros();
    console.log(`✅ Búsqueda finalizada: ${this.preguntasFiltradas.length} preguntas encontradas`);
  }

  aplicarFiltros() {
    console.log('=== APLICANDO FILTROS ===');
    console.log('Filtros actuales:', this.filtros);
    console.log('Total de preguntas en BD:', this.preguntas.length);
    
    // Si no hay filtros activos, no mostrar nada
    if (!this.filtros.categoria && !this.filtros.modulo && 
        !this.filtros.submodulo && !this.filtros.subsubmodulo && !this.filtros.subsubsubmodulo) {
      console.log('✓ Sin filtros activos, no mostrar preguntas');
      this.preguntasFiltradas = [];
      console.log(`✅ Resultados: ${this.preguntasFiltradas.length} preguntas encontradas`);
      return;
    }

    // Determinar el módulo específico seleccionado (el más específico disponible)
    let moduloIdBuscado: number | null = null;
    
    // Buscar el filtro más específico que esté seleccionado
    if (this.filtros.subsubsubmodulo !== null) {
      moduloIdBuscado = Number(this.filtros.subsubsubmodulo);
      console.log(`Filtrando por sub-sub-submódulo específico: ${moduloIdBuscado}`);
    } else if (this.filtros.subsubmodulo !== null) {
      moduloIdBuscado = Number(this.filtros.subsubmodulo);
      console.log(`Filtrando por sub-submódulo específico: ${moduloIdBuscado}`);
    } else if (this.filtros.submodulo !== null) {
      moduloIdBuscado = Number(this.filtros.submodulo);
      console.log(`Filtrando por submódulo específico: ${moduloIdBuscado}`);
    } else if (this.filtros.modulo !== null) {
      moduloIdBuscado = Number(this.filtros.modulo);
      console.log(`Filtrando por módulo específico: ${moduloIdBuscado}`);
    } else if (this.filtros.categoria !== null) {
      moduloIdBuscado = Number(this.filtros.categoria);
      console.log(`Filtrando por categoría específica: ${moduloIdBuscado}`);
    }

    if (moduloIdBuscado === null) {
      console.log('No hay módulo específico seleccionado');
      this.preguntasFiltradas = [];
      return;
    }

    // Buscar SOLO preguntas que tengan exactamente ese Idmodulo (no hijos)
    console.log(`Buscando preguntas con Idmodulo = ${moduloIdBuscado} (exacto, sin hijos)`);
    
    // Debug: Mostrar algunos Idmodulo de las preguntas
    console.log('Primeras 5 preguntas con sus Idmodulo:', 
      this.preguntas.slice(0, 5).map(p => ({ id: p.id, Idmodulo: p.Idmodulo, tipo: typeof p.Idmodulo }))
    );

    this.preguntasFiltradas = this.preguntas.filter(p => {
      // Asegurar comparación numérica
      const preguntaModuloId = Number(p.Idmodulo);
      const coincide = preguntaModuloId === moduloIdBuscado;
      if (coincide) {
        console.log(`  ✓ Pregunta ID ${p.id} (Idmodulo=${p.Idmodulo}) coincide exactamente con ${moduloIdBuscado}`);
      }
      return coincide;
    });
    
    console.log(`✅ Resultados: ${this.preguntasFiltradas.length} preguntas encontradas para módulo ${moduloIdBuscado}`);
    
    // Mensaje informativo si no hay preguntas
    if (this.preguntasFiltradas.length === 0) {
      const moduloSeleccionado = this.modulosCompletos.find(m => Number(m.id) === moduloIdBuscado);
      console.log(`ℹ️ El módulo "${moduloSeleccionado?.nombre}" (ID: ${moduloIdBuscado}) no tiene preguntas directamente asignadas`);
      console.log('Módulos con preguntas:', [...new Set(this.preguntas.map(p => p.Idmodulo))]);
    }
  }

  /**
   * Obtiene recursivamente todos los submódulos de un módulo padre
   */
  obtenerTodosLosSubmódulos(moduloId: number): number[] {
    const resultado: number[] = [];
    const modId = Number(moduloId);
    
    // Si no tenemos los módulos completos aún, no podemos hacer nada
    if (!this.modulosCompletos || this.modulosCompletos.length === 0) {
      console.warn('modulosCompletos no está cargado aún');
      return resultado;
    }

    // Encontrar todos los módulos hijos directos e indirectos
    const procesar = (id: number) => {
      resultado.push(id);
      
      // Buscar submódulos directos de este ID
      const hijos = this.modulosCompletos.filter(m => {
        const mIdpadre = m.idpadre ? Number(m.idpadre) : null;
        return mIdpadre === id;
      });
      hijos.forEach(hijo => {
        procesar(Number(hijo.id));
      });
    };

    procesar(modId);
    console.log(`obtenerTodosLosSubmódulos(${modId}) devuelve: [${resultado.join(', ')}]`);
    return resultado;
  }

  limpiarFiltros() {
    this.filtros = {
      categoria: null,
      modulo: null,
      submodulo: null,
      subsubmodulo: null,
      subsubsubmodulo: null
    };
    this.modulos = [];
    this.submodulos = [];
    this.subsubmodulos = [];
    this.subsubsubmodulos = [];
    this.preguntasFiltradas = [];
    this.consultaRealizada = false;
  }

  getLabelNivel(nivel: number): string {
    const labels = ['Categoría', 'Módulo', 'Submódulo', 'Sub-submódulo', 'Detalle'];
    return labels[nivel] ?? `Nivel ${nivel + 1}`;
  }

  inicializarModalSeleccionModulo(idModuloPreseleccionado?: number | null): void {
    const todos = this.modulosParaFormulario;
    const ids = new Set(todos.map(m => Number(m.id)));
    const raices = todos.filter(m => !m.idpadre || !ids.has(Number(m.idpadre)));

    if (!raices.length) {
      this.modalNiveles = [];
      this.modalSelecciones = [];
      return;
    }

    const niveles: Modulo[][] = [raices];
    const selecciones: (number | null)[] = [null];

    if (idModuloPreseleccionado) {
      const byId = new Map(todos.map(m => [Number(m.id), m]));
      const ruta: number[] = [];
      let current = byId.get(Number(idModuloPreseleccionado));
      while (current) {
        ruta.unshift(Number(current.id));
        if (!current.idpadre || !ids.has(Number(current.idpadre))) break;
        current = byId.get(Number(current.idpadre));
      }
      ruta.forEach((id, i) => {
        selecciones[i] = id;
        const hijos = todos.filter(m => Number(m.idpadre) === id);
        if (hijos.length > 0) {
          niveles[i + 1] = hijos;
          selecciones[i + 1] = ruta[i + 1] ?? null;
        }
      });
    }

    this.modalNiveles = niveles;
    this.modalSelecciones = selecciones;
  }

  onModalNivelChange(nivel: number): void {
    const selId = this.modalSelecciones[nivel];
    const nuevosNiveles = this.modalNiveles.slice(0, nivel + 1);
    const nuevasSelecciones = this.modalSelecciones.slice(0, nivel + 1);

    if (selId != null) {
      const hijos = this.modulosParaFormulario.filter(m => Number(m.idpadre) === Number(selId));
      if (hijos.length > 0) {
        nuevosNiveles.push(hijos);
        nuevasSelecciones.push(null);
      }
    }

    this.modalNiveles = nuevosNiveles;
    this.modalSelecciones = nuevasSelecciones;

    const deepest = [...nuevasSelecciones].reverse().find(s => s != null);
    this.nuevaPregunta.Idmodulo = deepest != null ? Number(deepest) : undefined;

    // Heredar Submodulo de preguntas existentes en el mismo módulo (solo al crear)
    if (!this.editandoPregunta && this.nuevaPregunta.Idmodulo) {
      const referencia = this.preguntas.find(
        p => Number(p.Idmodulo) === this.nuevaPregunta.Idmodulo && p.Submodulo
      );
      if (referencia) {
        this.nuevaPregunta.Submodulo = referencia.Submodulo;
      }
    }
  }

  abrirAgregar() {
    this.editandoPregunta = false;
    this.nuevaPregunta = {
      Pregunta: '',
      Respuesta: '',
      Idmodulo: undefined,
      Aplicativo: undefined,
      Submodulo: undefined,
      Modulo: undefined
    };
    this.inicializarModalSeleccionModulo();
    this.mostrarFormulario = true;
  }

  editarPregunta(pregunta: Pregunta) {
    this.editandoPregunta = true;
    this.nuevaPregunta = { ...pregunta };
    this.inicializarModalSeleccionModulo(pregunta.Idmodulo);
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.editandoPregunta = false;
    this.modalNiveles = [];
    this.modalSelecciones = [];
  }

  actualizarModuloNombre() {
    // Este método ahora solo valida que se haya seleccionado un módulo
    if (this.nuevaPregunta.Idmodulo) {
      const modulo = this.categorias.find(c => c.id === this.nuevaPregunta.Idmodulo);
      if (modulo) {
        console.log('Módulo seleccionado:', modulo.nombre);
      }
    }
  }

  guardarPregunta() {

    const respuestaPlana = (this.nuevaPregunta.Respuesta || '').replace(/<[^>]*>/g, '').trim();

    if (!this.nuevaPregunta.Pregunta || !respuestaPlana) {
      this.toast.warning('Por favor completa los campos requeridos');
      return;
    }

    if (!this.nuevaPregunta.Idmodulo) {
      this.toast.warning('Por favor selecciona un módulo');
      return;
    }

    // Preparar los datos asegurando que undefined se convierta en null
    const preguntaData = {
      Pregunta: this.nuevaPregunta.Pregunta,
      Respuesta: this.nuevaPregunta.Respuesta,
      Idmodulo: this.nuevaPregunta.Idmodulo,
      Aplicativo: this.nuevaPregunta.Aplicativo || undefined,
      Submodulo: this.nuevaPregunta.Submodulo || undefined,
      Modulo: this.nuevaPregunta.Modulo || undefined
    };

    if (this.editandoPregunta) {
      this.preguntaService.updatePregunta(this.nuevaPregunta.id!, preguntaData).subscribe({
        next: () => {
          this.toast.success('Pregunta actualizada exitosamente');
          this.cerrarFormulario();
          this.cargarDatos();
          if (this.consultaRealizada) {
            this.buscarPreguntas();
          }
        },
        error: (error: any) => {
          console.error('Error al actualizar pregunta:', error);
          this.toast.error('Error al actualizar la pregunta: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.preguntaService.createPregunta(preguntaData).subscribe({
        next: () => {
          this.toast.success('Pregunta creada exitosamente');
          this.cerrarFormulario();
          this.cargarDatos();
          if (this.consultaRealizada) {
            this.buscarPreguntas();
          }
        },
        error: (error: any) => {
          console.error('Error al crear pregunta:', error);
          this.toast.error('Error al crear la pregunta: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  eliminarPregunta(pregunta: any) {
    const directId = pregunta?.id ?? pregunta?.ID ?? pregunta?.Id ?? pregunta?.id_pregunta ?? pregunta?.Id_pregunta ?? pregunta?.IdPreguntas ?? pregunta?.idpreguntas;
    const resolvedId = this.resolverIdPregunta(pregunta) ?? directId;
    const parsedId = Number(resolvedId);
    const targetId = Number.isFinite(parsedId) ? parsedId : resolvedId;

    console.debug('Eliminar pregunta: objeto recibido', pregunta);
    console.debug('Eliminar pregunta: directId', directId, 'resolvedId', resolvedId, 'targetId', targetId);

    if (targetId === null || targetId === undefined || targetId === '') {
      this.toast.error('No se pudo determinar el ID de la pregunta');
      console.error('Eliminar pregunta: sin id', pregunta);
      return;
    }

    this.toast.confirm('¿Estás seguro de que deseas eliminar esta pregunta?').then(ok => {
      if (!ok) return;
      this.preguntaService.deletePregunta(targetId).subscribe({
        next: () => {
          this.toast.success('Pregunta eliminada exitosamente');
          const idStr = `${targetId}`;
          this.preguntas = this.preguntas.filter(q => `${this.getPreguntaId(q)}` !== idStr);
          this.preguntasFiltradas = this.preguntasFiltradas.filter(q => `${this.getPreguntaId(q)}` !== idStr);
          if (this.consultaRealizada) {
            this.aplicarFiltros();
          }
        },
        error: (error: any) => {
          console.error('Error al eliminar pregunta:', error);
          this.toast.error('Error al eliminar la pregunta: ' + (error.error?.message || error.message));
        }
      });
    });
  }

  sanitizar(texto: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(texto || '');
  }

  previsualizarLimpiezaNumeros() {
    this.mostrarModalLimpieza = true;
    this.cargandoLimpieza = true;
    this.previsualizacionLimpieza = null;

    this.preguntaService.limpiarNumeros(true).subscribe({
      next: (response) => {
        this.previsualizacionLimpieza = response;
        this.cargandoLimpieza = false;
      },
      error: (error) => {
        console.error('Error al obtener previsualización:', error);
        this.toast.error('Error al obtener la vista previa de limpieza');
        this.cerrarModalLimpieza();
      }
    });
  }

  aplicarLimpiezaNumeros() {
    this.toast.confirm('¿Confirmas que deseas aplicar estos cambios? Esta acción es permanente.').then(ok => {
      if (!ok) return;
      this.cargandoLimpieza = true;
      this.preguntaService.limpiarNumeros(false).subscribe({
        next: (response) => {
          this.toast.success(`Limpieza completada: ${response.guardadas} pregunta(s) actualizadas`);
          this.cerrarModalLimpieza();
          this.cargarDatos();
          if (this.consultaRealizada) {
            this.buscarPreguntas();
          }
        },
        error: (error) => {
          console.error('Error al aplicar limpieza:', error);
          this.toast.error('Error al aplicar la limpieza de números');
          this.cargandoLimpieza = false;
        }
      });
    });
  }

  cerrarModalLimpieza() {
    this.mostrarModalLimpieza = false;
    this.cargandoLimpieza = false;
    this.previsualizacionLimpieza = null;
  }

  private aplicarPermisosModulos(modulos: Modulo[]): Modulo[] {
    if (this.isAdmin) {
      return modulos;
    }

    const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
    const byId = new Map<number, Modulo>();
    modulos.forEach(m => byId.set(Number(m.id), m));

    const withAncestors = new Set<number>();
    const addAncestors = (id: number | null | undefined) => {
      if (!id) return;
      if (withAncestors.has(id)) return;
      withAncestors.add(id);
      const parentId = byId.get(id)?.idpadre;
      if (parentId) {
        addAncestors(Number(parentId));
      }
    };

    allowed.forEach(id => addAncestors(id));

    return modulos.filter(m => withAncestors.has(Number(m.id)));
  }

  private aplicarPermisosPreguntas(preguntas: Pregunta[]): Pregunta[] {
    if (this.isAdmin) {
      return preguntas;
    }

    const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
    return preguntas.filter(p => allowed.has(Number(p.Idmodulo)));
  }

  private refrescarCategoriasPermitidas() {
    console.log('=== refrescarCategoriasPermitidas ===');
    console.log('isAdmin:', this.isAdmin);
    console.log('allowedModuleIds:', this.allowedModuleIds);
    console.log('modulosCompletos.length:', this.modulosCompletos.length);

    if (this.isAdmin) {
      this.categorias = this.modulosCompletos.filter(m => !m.idpadre);
      console.log('Admin → categorias raíz:', this.categorias.map(c => c.nombre));
      return;
    }

    const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
    const byId = new Map<number, Modulo>();
    this.modulosCompletos.forEach(m => byId.set(Number(m.id), m));

    console.log('allowed IDs:', [...allowed]);
    console.log('byId keys (primeros 10):', [...byId.keys()].slice(0, 10));

    const raicesPermitidas = new Set<number>();
    allowed.forEach(id => {
      let current = byId.get(id);
      while (current) {
        if (!current.idpadre) {
          console.log(`  ID ${id} → raíz encontrada: ${current.id} (${current.nombre})`);
          raicesPermitidas.add(Number(current.id));
          break;
        }
        console.log(`  ID ${id} → subiendo de ${current.id} (${current.nombre}) a padre ${current.idpadre}`);
        current = byId.get(Number(current.idpadre));
      }
      if (!current) {
        console.warn(`  ID ${id} → no encontrado en byId!`);
      }
    });

    console.log('raicesPermitidas:', [...raicesPermitidas]);

    this.categorias = this.modulosCompletos.filter(
      m => !m.idpadre && raicesPermitidas.has(Number(m.id))
    );
    console.log('categorias resultantes:', this.categorias.map(c => `${c.id}:${c.nombre}`));
  }

  private aplicarPermisosModulosFormulario(modulos: Modulo[]): Modulo[] {
    if (this.isAdmin) {
      return modulos;
    }

    // Solo módulos donde el usuario puede crear preguntas (sin ancestros)
    const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
    return modulos.filter(m => allowed.has(Number(m.id)));
  }

  /**
   * Obtiene la ruta completa de módulos desde la categoría raíz hasta el módulo de la pregunta
   * Retorna un array de nombres de módulos en orden jerárquico
   * Ejemplo: ['ESTRATEGICOS', 'PACO'] o ['MISIONALES', 'SIF', 'CREA', 'ARTISTA FORMADOR']
   */
  getRutaModulos(idModulo?: number | null): string[] {
    if (!idModulo || !this.modulosCompletos?.length) {
      return [];
    }

    // Crear mapa para búsqueda rápida
    const byId = new Map<number, Modulo>();
    this.modulosCompletos.forEach(m => byId.set(Number(m.id), m));

    // Construir la ruta desde el módulo actual hasta la raíz
    const ruta: string[] = [];
    let actual = byId.get(Number(idModulo));

    while (actual) {
      ruta.unshift(actual.nombre); // Agregar al inicio para mantener orden correcto
      
      // Si no tiene padre, ya llegamos a la raíz (categoría)
      if (!actual.idpadre) {
        break;
      }
      
      // Subir al padre
      actual = byId.get(Number(actual.idpadre));
    }

    return ruta;
  }

  /**
   * Construye la lista de módulos permitidos en orden jerárquico (DFS),
   * con prefijo de espacios para indicar el nivel de anidamiento.
   * Usado en el select del modal de creación/edición de preguntas.
   */
  get modulosFormularioJerarquicos(): { id: number; label: string }[] {
    if (!this.modulosParaFormulario?.length) return [];

    const ids = new Set(this.modulosParaFormulario.map(m => Number(m.id)));

    // Mapa padre -> hijos (solo dentro de la lista filtrada)
    const children = new Map<number | null, Modulo[]>();
    this.modulosParaFormulario.forEach(m => {
      const parentId = m.idpadre && ids.has(Number(m.idpadre))
        ? Number(m.idpadre)
        : null;
      if (!children.has(parentId)) children.set(parentId, []);
      children.get(parentId)!.push(m);
    });

    const result: { id: number; label: string }[] = [];

    const traverse = (parentId: number | null, depth: number) => {
      const kids = children.get(parentId) || [];
      kids.forEach(m => {
        // 4 espacios no separables por nivel
        const prefix = '\u00A0'.repeat(depth * 4);
        result.push({ id: Number(m.id), label: prefix + m.nombre });
        traverse(Number(m.id), depth + 1);
      });
    };

    traverse(null, 0);
    return result;
  }

  // ========== DRAG AND DROP ==========
  
  toggleModoReorden() {
    if (this.modoReorden) {
      // Guardar el nuevo orden
      this.guardarNuevoOrden();
    } else {
      // Activar modo reorden y guardar orden original
      this.ordenOriginal = [...this.preguntasFiltradas];
      this.modoReorden = true;
    }
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  onDragEnd(event: DragEvent) {
    this.draggedIndex = null;
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    if (this.draggedIndex !== null && this.draggedIndex !== index) {
      // Reordenar visualmente
      const draggedItem = this.preguntasFiltradas[this.draggedIndex];
      this.preguntasFiltradas.splice(this.draggedIndex, 1);
      this.preguntasFiltradas.splice(index, 0, draggedItem);
      this.draggedIndex = index;
    }
  }

  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
  }

  guardarNuevoOrden() {
    // Crear el array con el nuevo orden
    const preguntasOrdenadas = this.preguntasFiltradas.map((pregunta, index) => ({
      id: this.getPreguntaId(pregunta),
      orden: index + 1
    }));

    this.preguntaService.reordenarPreguntas(preguntasOrdenadas).subscribe({
      next: (response) => {
        console.log('Orden guardado exitosamente:', response);
        this.toast.success('Orden guardado exitosamente');
        this.modoReorden = false;
        // Recargar las preguntas para obtener el nuevo orden del servidor
        this.buscarPreguntas();
      },
      error: (error) => {
        console.error('Error al guardar el orden:', error);
        this.toast.error('Error al guardar el nuevo orden de las preguntas');
        // Restaurar el orden original
        this.preguntasFiltradas = [...this.ordenOriginal];
        this.modoReorden = false;
      }
    });
  }
}
