import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModuloService, Modulo } from '../../services/modulo.service';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-modulos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-modulos">
      <!-- ENCABEZADO -->
      <div class="page-header">
        <h2>Consulta de Módulos</h2>
        <p class="subtitle">Gestión y organización de la jerarquía de módulos</p>
      </div>

      <!-- SECCIÓN DE FILTROS -->
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

          <div class="form-group" *ngIf="modulosDisponibles.length > 0">
            <label>Módulo:</label>
            <select [(ngModel)]="filtros.modulo" (change)="onModuloChange()" name="modulo">
              <option [value]="null">Todos los módulos</option>
              <option *ngFor="let mod of modulosDisponibles" [value]="mod.id">
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
          <button type="button" class="btn-consultar" (click)="buscarModulos()">
            <span>🔍</span> Consultar
          </button>
          <button type="button" class="btn-limpiar" (click)="limpiarFiltros()">
            <span>🗑️</span> Limpiar Filtros
          </button>
        </div>
      </div>

      <!-- SECCIÓN DE RESULTADOS -->
      <div class="results-section">
        <div class="results-header">
          <div class="header-info">
            <h3>Resultados de Búsqueda</h3>
            <span class="count-badge" *ngIf="consultaRealizada">
              {{ modulosFiltrados.length }} {{ modulosFiltrados.length === 1 ? 'módulo' : 'módulos' }}
            </span>
          </div>
          <button class="btn-add-question" (click)="abrirAgregar()">
            <span>➕</span> Agregar Nuevo Módulo
          </button>
        </div>

        <div class="no-results" *ngIf="consultaRealizada && modulosFiltrados.length === 0">
          <p>No se encontraron módulos con los filtros seleccionados</p>
          <small>Intenta modificar los criterios de búsqueda</small>
        </div>

        <div class="no-results" *ngIf="!consultaRealizada">
          <p>Utiliza los filtros para buscar módulos</p>
          <small>Selecciona al menos una categoría y presiona "Consultar"</small>
        </div>

        <div class="modulos-lista" *ngIf="consultaRealizada && modulosFiltrados.length > 0">
          <div class="modulo-item" *ngFor="let modulo of modulosFiltrados; let i = index">
            <div class="modulo-content">
              <div class="modulo-header">
                <span class="numero">{{ i + 1 }}.</span>
                <div class="modulo-meta">
                  <!-- <span class="id-badge">ID: {{ modulo.id }}</span> -->
                  <span class="jerarquia-badge" *ngIf="modulo.idpadre">
                    Modulo de: {{ getNombrePadre(modulo.idpadre) }}
                  </span>
                </div>
              </div>
              
              <div class="modulo-text">
                <strong>Nombre:</strong> {{ modulo.nombre }}
              </div>
              
              <div class="descripcion-text" *ngIf="modulo.descripcion">
                <strong>Descripción:</strong> {{ modulo.descripcion }}
              </div>
            </div>
            
            <div class="modulo-acciones">
              <button class="btn-edit" *ngIf="canEditModule(modulo.id!)" (click)="editarModulo(modulo)">
                <span>✏️</span> Editar
              </button>
              <button class="btn-delete" *ngIf="isAdmin" (click)="eliminarModulo(modulo.id!)">
                <span>🗑️</span> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL PARA AGREGAR/EDITAR -->
    <div class="modal-overlay" *ngIf="mostrarFormulario" (click)="cerrarFormulario()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editandoModulo ? 'Editar Módulo' : 'Agregar Nuevo Módulo' }}</h3>
          <button class="btn-close" (click)="cerrarFormulario()">&times;</button>
        </div>
        
        <div class="modal-body">
          <form (ngSubmit)="guardarModulo()">
            <div class="form-group">
              <label for="modal-nombre">Nombre del Módulo *</label>
              <input 
                id="modal-nombre"
                type="text" 
                [(ngModel)]="nuevoModulo.nombre" 
                name="nombre"
                placeholder="Ingrese el nombre del módulo"
                required
              />
            </div>

            <div class="form-group">
              <label for="modal-descripcion">Descripción</label>
              <textarea 
                id="modal-descripcion"
                [(ngModel)]="nuevoModulo.descripcion" 
                name="descripcion"
                placeholder="Ingrese una descripción opcional"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="modal-icono">Icono del Módulo</label>
              <input 
                id="modal-icono"
                type="file" 
                (change)="onFileSelect($event)"
                accept="image/*"
                name="icono"
              />
              <small class="help-text">Formatos: JPG, PNG, GIF, SVG. Tamaño máximo: 2MB</small>
              <div class="preview-container" *ngIf="previewUrl">
                <img [src]="previewUrl" alt="Vista previa" class="icon-preview">
                <button type="button" class="btn-remove-icon" (click)="removeIcon()">✕</button>
              </div>
            </div>

            <div class="form-group">
              <label for="modal-categoria">Categoría (Módulo Padre)</label>
              <select 
                id="modal-categoria"
                [(ngModel)]="nuevoModulo.categoria" 
                name="categoria"
                (ngModelChange)="onModalCategoriaChange()"
                [disabled]="jerarquiaBloqueada"
              >
                <option *ngIf="isAdmin" [ngValue]="null">Ninguna (es una categoría raíz)</option>
                <option *ngFor="let cat of todasLasCategorias" [ngValue]="cat.id">
                  {{ cat.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group" *ngIf="nuevoModulo.categoria">
              <label for="modal-modulo">Módulo</label>
              <select 
                id="modal-modulo"
                [(ngModel)]="nuevoModulo.modulo" 
                name="modulo"
                (ngModelChange)="onModalModuloChange()"
                [disabled]="jerarquiaBloqueada || modulosModal.length === 0"
              >
                <option [ngValue]="null">Ninguno (es hijo directo de categoría)</option>
                <option *ngFor="let mod of modulosModal" [ngValue]="mod.id">
                  {{ mod.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group" *ngIf="nuevoModulo.modulo">
              <label for="modal-submodulo">Submódulo</label>
              <select 
                id="modal-submodulo"
                [(ngModel)]="nuevoModulo.submodulo" 
                name="submodulo"
                (ngModelChange)="onModalSubmoduloChange()"
                [disabled]="jerarquiaBloqueada || submodulosModal.length === 0"
              >
                <option [ngValue]="null">Ninguno (es hijo directo de módulo)</option>
                <option *ngFor="let sub of submodulosModal" [ngValue]="sub.id">
                  {{ sub.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group" *ngIf="nuevoModulo.submodulo">
              <label for="modal-subsubmodulo">Submódulo Nivel 1</label>
              <select 
                id="modal-subsubmodulo"
                [(ngModel)]="nuevoModulo.subsubmodulo" 
                name="subsubmodulo"
                [disabled]="jerarquiaBloqueada || subsubmodulosModal.length === 0"
              >
                <option [ngValue]="null">Ninguno (es hijo directo de submódulo)</option>
                <option *ngFor="let subsub of subsubmodulosModal" [ngValue]="subsub.id">
                  {{ subsub.nombre }}
                </option>
              </select>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-save">
                <span>💾</span> {{ editandoModulo ? 'Actualizar' : 'Guardar' }}
              </button>
              <button type="button" class="btn-cancel" (click)="cerrarFormulario()">
                <span>❌</span> Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-modulos {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    /* ENCABEZADO */
    .page-header {
      margin-bottom: 40px;

      h2 {
        margin: 0 0 10px 0;
        color: #2c3e50;
        font-size: 32px;
        font-weight: 700;
      }

      .subtitle {
        margin: 0;
        color: #7f8c8d;
        font-size: 14px;
      }
    }

    /* SECCIÓN DE FILTROS */
    .filter-section {
      background: #39275c;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(101, 85, 143, 0.2);
    }

    .section-title {
      color: white;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 20px 0;
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
      margin-bottom: 8px;
      color: rgba(255, 255, 255, 0.95);
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    select, input, textarea {
      padding: 12px 14px;
      border: 2px solid #000000;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
      background-color: #fafafa;
      color: #2c3e50;

      &:hover {
        border-color: #333333;
      }

      &:focus {
        outline: none;
        border-color: #65558F;
        border-width: 3px;
        background-color: white;
        box-shadow: 0 0 0 3px rgba(101, 85, 143, 0.2);
      }

      &:disabled {
        background-color: #f0f0f0;
        cursor: not-allowed;
        opacity: 0.6;
        border-color: #cccccc;
      }
    }

    textarea {
      min-height: 100px;
      resize: vertical;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
    }

    input[type="file"] {
      padding: 10px;
      background: white;
      cursor: pointer;
    }

    .help-text {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      font-style: italic;
    }

    .preview-container {
      margin-top: 15px;
      position: relative;
      display: inline-block;
    }

    .icon-preview {
      max-width: 150px;
      max-height: 150px;
      border-radius: 8px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      object-fit: contain;
      background: white;
      padding: 10px;
    }

    .btn-remove-icon {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.2s ease;

      &:hover {
        background: #da190b;
        transform: scale(1.1);
      }
    }

    .filter-actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 12px;
      justify-content: flex-start;
      flex-wrap: wrap;
      margin-top: 10px;
    }

    /* BOTONES */
    .btn-consultar, .btn-limpiar, .btn-add-question, .btn-edit, .btn-delete, .btn-save, .btn-cancel, .btn-close {
      padding: 11px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;

      span {
        font-size: 16px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .btn-consultar {
      background-color: white;
      color: #65558F;
      font-weight: 700;

      &:hover {
        background-color: #f0f0f0;
      }
    }

    .btn-limpiar {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid white;

      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
      }
    }

    .btn-add-question {
      background-color: #4CAF50;
      color: white;

      &:hover {
        background-color: #45a049;
      }
    }

    .btn-edit {
      background-color: #2196F3;
      color: white;
      padding: 8px 16px;
      font-size: 12px;

      &:hover {
        background-color: #0b7dda;
      }
    }

    .btn-delete {
      background-color: #f44336;
      color: white;
      padding: 8px 16px;
      font-size: 12px;

      &:hover {
        background-color: #da190b;
      }
    }

    .btn-save {
      background-color: #65558F;
      color: white;

      &:hover {
        background-color: #5F448F;
      }
    }

    .btn-cancel {
      background-color: #e0e0e0;
      color: #333;

      &:hover {
        background-color: #d0d0d0;
      }
    }

    /* SECCIÓN DE RESULTADOS */
    .results-section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;

      .header-info {
        display: flex;
        align-items: center;
        gap: 15px;

        h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 20px;
        }

        .count-badge {
          background-color: #65558F;
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
      }
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
      color: #7f8c8d;

      p {
        margin: 0 0 10px 0;
        font-size: 18px;
        font-weight: 500;
      }

      small {
        display: block;
        color: #95a5a6;
        font-size: 13px;
      }
    }

    /* LISTA DE MÓDULOS */
    .modulos-lista {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modulo-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px;
      border: 1px solid #e8ecf1;
      border-left: 4px solid #65558F;
      border-radius: 8px;
      background-color: #fafbfc;
      transition: all 0.3s ease;

      &:hover {
        background-color: #f5f8fb;
        border-left-color: #B35C9A;
        box-shadow: 0 4px 12px rgba(101, 85, 143, 0.1);
      }
    }

    .modulo-content {
      flex: 1;
      min-width: 0;
    }

    .modulo-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .numero {
        font-size: 18px;
        font-weight: 700;
        color: #65558F;
        min-width: 30px;
      }

      .modulo-meta {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;

        .id-badge {
          background-color: #ecf0f1;
          color: #7f8c8d;
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          font-family: 'Monaco', monospace;
        }

        .jerarquia-badge {
          background-color: #EBE9F2;
          color: #5F448F;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
      }
    }

    .modulo-text, .descripcion-text {
      margin-bottom: 12px;
      line-height: 1.6;
      color: #2c3e50;
      font-size: 14px;

      strong {
        color: #65558F;
        margin-right: 8px;
        font-weight: 700;
      }
    }

    .descripcion-text {
      color: #555;
      font-size: 13px;
      padding: 12px;
      background-color: rgba(101, 85, 143, 0.05);
      border-radius: 4px;
      border-left: 3px solid #65558F;
      margin-bottom: 0;
    }

    .modulo-acciones {
      display: flex;
      gap: 10px;
      margin-left: 20px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    /* MODAL */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 700px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 25px;
      border-bottom: 1px solid #ecf0f1;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 20px;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #bdc3c7;
        padding: 0;
        transition: color 0.2s;

        &:hover {
          color: #2c3e50;
          transform: none;
          box-shadow: none;
        }
      }
    }

    .modal-body {
      padding: 25px;

      form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-group label {
        color: #2c3e50;
        font-weight: 600;
        font-size: 14px;
      }

      .form-group input,
      .form-group select,
      .form-group textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #000000;
        border-radius: 8px;
        font-size: 14px;
        background: #fafafa;
        color: #2c3e50;
        transition: all 0.3s ease;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .form-group input:focus,
      .form-group select:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: #65558F;
        border-width: 3px;
        background: white;
        box-shadow: 0 0 0 3px rgba(101, 85, 143, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .form-group input:disabled,
      .form-group select:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
      }

      .form-group textarea {
        min-height: 80px;
        resize: vertical;
        font-family: inherit;
      }

      .form-group input[type="file"] {
        padding: 10px;
        cursor: pointer;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #ecf0f1;
      }
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .filter-form {
        grid-template-columns: 1fr;
      }

      .results-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;

        .header-info {
          flex-direction: column;
          gap: 10px;
          width: 100%;

          h3 {
            font-size: 18px;
          }
        }

        .btn-add-question {
          width: 100%;
          justify-content: center;
        }
      }

      .modulo-item {
        flex-direction: column;

        .modulo-acciones {
          margin-left: 0;
          margin-top: 15px;
          width: 100%;
          justify-content: flex-start;

          button {
            flex: 1;
            justify-content: center;
          }
        }
      }
    }
  `]
})
export class AdminModulosComponent implements OnInit {
  modulos: Modulo[] = [];
  categorias: Modulo[] = [];
  todasLasCategorias: Modulo[] = [];
  modulosDisponibles: Modulo[] = [];
  submodulosDisponibles: Modulo[] = [];
  subsubmodulosDisponibles: Modulo[] = [];
  subsubsubmodulosDisponibles: Modulo[] = [];
  modulosCompletos: Modulo[] = [];
  jerarquiaBloqueada = false;
  idPadreSeleccionado: number | null = null;

  // Para los filtros de búsqueda
  filtros = {
    categoria: null as number | null,
    modulo: null as number | null,
    submodulo: null as number | null,
    subsubmodulo: null as number | null,
    subsubsubmodulo: null as number | null
  };

  // Para las cascadas en filtros
  submodulos: Modulo[] = [];
  subsubmodulos: Modulo[] = [];
  subsubsubmodulos: Modulo[] = [];

  // Para las cascadas en el modal
  modulosModal: Modulo[] = [];
  submodulosModal: Modulo[] = [];
  subsubmodulosModal: Modulo[] = [];

  mostrarFormulario = false;
  editandoModulo = false;
  modulosFiltrados: Modulo[] = [];
  consultaRealizada = false;

  nuevoModulo: any = {
    nombre: '',
    descripcion: '',
    categoria: null,
    modulo: null,
    submodulo: null,
    subsubmodulo: null
  };

  // Para manejo de archivos
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Permisos
  isAdmin = false;
  allowedModuleIds: number[] = [];

  constructor(
    private moduloService: ModuloService,
    private categoriaService: CategoriaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.allowedModuleIds = this.authService.getAllowedModuleIds();
    console.log('🔐 Permisos cargados en admin-modulos:', {
      isAdmin: this.isAdmin,
      allowedModuleIds: this.allowedModuleIds,
      user: this.authService.getUser()
    });
    this.cargarDatos();
  }

  cargarDatos() {
    console.log('=== INICIANDO CARGA DE DATOS DE MÓDULOS ===');
    
    // Cargar todos los módulos
    this.categoriaService.getModulos().subscribe({
      next: (data: any[]) => {
        console.log('✅ Módulos cargados:', data);
        this.modulos = data.map(m => ({
          ...m,
          id: Number(m.id || m.idMODULOS),
          idpadre: m.idpadre ? Number(m.idpadre) : null
        }));
        this.modulosCompletos = [...this.modulos];
        this.modulosDisponibles = [...this.modulos];
        console.log('Total de módulos:', this.modulos.length);
      },
      error: (error: any) => {
        console.error('❌ ERROR al cargar módulos:', error);
      }
    });

    // Cargar categorías (módulos sin padre)
    this.categoriaService.getCategorias().subscribe({
      next: (data: any[]) => {
        console.log('✅ Categorías cargadas:', data);
        this.categorias = this.aplicarPermisosCategoriasModal(data);
        this.todasLasCategorias = this.aplicarPermisosCategoriasModal([...data]);
        console.log('Total de categorías:', this.categorias.length);
      },
      error: (error: any) => {
        console.error('❌ ERROR al cargar categorías:', error);
      }
    });
  }

  onCategoriaChange() {
    console.log('=== CAMBIO DE CATEGORÍA ===');
    console.log('Categoría seleccionada:', this.filtros.categoria);
    
    this.filtros.modulo = null;
    this.filtros.submodulo = null;
    this.filtros.subsubmodulo = null;
    this.filtros.subsubsubmodulo = null;
    this.modulosDisponibles = [];
    this.submodulos = [];
    this.subsubmodulos = [];
    this.subsubsubmodulos = [];

    if (this.filtros.categoria && this.modulosCompletos.length > 0) {
      const catId = Number(this.filtros.categoria);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === catId);
      
      // Aplicar filtro de permisos
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      
      this.modulosDisponibles = hijos;
      console.log(`Módulos encontrados para categoría ${catId}:`, this.modulosDisponibles);
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

    if (this.filtros.modulo && this.modulosCompletos.length > 0) {
      const modId = Number(this.filtros.modulo);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === modId);
      
      // Aplicar filtro de permisos
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      
      this.submodulos = hijos;
      console.log(`Submódulos encontrados para módulo ${modId}:`, this.submodulos);
    }
  }

  onSubmoduloChange() {
    console.log('=== CAMBIO DE SUBMÓDULO ===');
    console.log('Submódulo seleccionado:', this.filtros.submodulo);
    
    this.filtros.subsubmodulo = null;
    this.filtros.subsubsubmodulo = null;
    this.subsubmodulos = [];
    this.subsubsubmodulos = [];

    if (this.filtros.submodulo && this.modulosCompletos.length > 0) {
      const submId = Number(this.filtros.submodulo);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === submId);
      
      // Aplicar filtro de permisos
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      
      this.subsubmodulos = hijos;
      console.log(`Sub-submódulos encontrados para submódulo ${submId}:`, this.subsubmodulos);
    }
  }

  onSubSubmoduloChange() {
    console.log('=== CAMBIO DE SUB-SUBMÓDULO ===');
    console.log('Sub-submódulo seleccionado:', this.filtros.subsubmodulo);
    
    this.filtros.subsubsubmodulo = null;
    this.subsubsubmodulos = [];

    if (this.filtros.subsubmodulo && this.modulosCompletos.length > 0) {
      const subsubId = Number(this.filtros.subsubmodulo);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === subsubId);
      
      // Aplicar filtro de permisos
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      
      this.subsubsubmodulos = hijos;
      console.log(`Sub-sub-submódulos encontrados para sub-submódulo ${subsubId}:`, this.subsubsubmodulos);
    }
  }

  buscarModulos() {
    console.log('=== BUSCANDO MÓDULOS CON FILTROS ===');
    console.log('Filtros seleccionados:', this.filtros);
    
    this.consultaRealizada = true;
    this.aplicarFiltros();
    console.log(`✅ Búsqueda finalizada: ${this.modulosFiltrados.length} módulos encontrados`);
  }

  aplicarFiltros() {
    console.log('=== APLICANDO FILTROS ===');
    
    if (!this.filtros.categoria && !this.filtros.modulo && 
        !this.filtros.submodulo && !this.filtros.subsubmodulo && !this.filtros.subsubsubmodulo) {
      console.log('✓ Sin filtros activos, mostrando todos los módulos');
      this.modulosFiltrados = [...this.modulos];
      return;
    }

    let modulosBuscados: number[] = [];
    
    // Obtener el ID del filtro más específico
    const moduloIdBuscado = this.filtros.subsubsubmodulo ?? this.filtros.subsubmodulo ?? 
                            this.filtros.submodulo ?? this.filtros.modulo ?? this.filtros.categoria;
    
    if (moduloIdBuscado !== null) {
      // Obtener SOLO los hijos directos del módulo seleccionado (sin recursión, sin incluir el padre)
      modulosBuscados = this.obtenerHijosDirectos(moduloIdBuscado);
      console.log(`Buscando hijos directos del módulo ${moduloIdBuscado}:`, modulosBuscados);
    }

    this.modulosFiltrados = this.modulos.filter(m => modulosBuscados.includes(m.id!));
    console.log(`✅ Resultados: ${this.modulosFiltrados.length} módulos encontrados`);
  }

  obtenerTodosLosSubmódulos(moduloId: number): number[] {
    const resultado: number[] = [];
    const modId = Number(moduloId);
    
    if (!this.modulosCompletos || this.modulosCompletos.length === 0) {
      return resultado;
    }

    const procesar = (id: number) => {
      resultado.push(id);
      const hijos = this.modulosCompletos.filter(m => {
        const mIdpadre = m.idpadre ? Number(m.idpadre) : null;
        return mIdpadre === id;
      });
      hijos.forEach(hijo => {
        procesar(Number(hijo.id));
      });
    };

    procesar(modId);
    return resultado;
  }

  /**
   * Obtiene SOLO los hijos directos de un módulo (sin recursión, sin incluir el padre)
   */
  obtenerHijosDirectos(moduloId: number): number[] {
    const modId = Number(moduloId);
    
    if (!this.modulosCompletos || this.modulosCompletos.length === 0) {
      return [];
    }

    // Filtrar solo los módulos que tienen como padre directo al módulo especificado
    const hijosDirectos = this.modulosCompletos.filter(m => {
      const mIdpadre = m.idpadre ? Number(m.idpadre) : null;
      return mIdpadre === modId;
    });

    // Retornar solo los IDs de los hijos directos
    return hijosDirectos.map(hijo => Number(hijo.id));
  }

  limpiarFiltros() {
    this.filtros = {
      categoria: null,
      modulo: null,
      submodulo: null,
      subsubmodulo: null,
      subsubsubmodulo: null
    };
    this.modulosDisponibles = [...this.modulosCompletos];
    this.submodulos = [];
    this.subsubmodulos = [];
    this.subsubsubmodulos = [];
    this.modulosFiltrados = [];
    this.consultaRealizada = false;
  }

  abrirAgregar() {
    this.editandoModulo = false;
    this.jerarquiaBloqueada = false;
    this.idPadreSeleccionado = null;
    this.nuevoModulo = {
      nombre: '',
      descripcion: '',
      categoria: null,
      modulo: null,
      submodulo: null,
      subsubmodulo: null
    };
    this.modulosModal = [];
    this.submodulosModal = [];
    this.subsubmodulosModal = [];

    const seleccionado = this.filtros.subsubsubmodulo ?? this.filtros.subsubmodulo ?? this.filtros.submodulo ?? this.filtros.modulo ?? this.filtros.categoria;
    if (seleccionado && this.modulosCompletos.length > 0) {
      this.prefijarJerarquiaParaNuevo(Number(seleccionado));
    }

    this.mostrarFormulario = true;
  }

  prefijarJerarquiaParaNuevo(targetId: number) {
    this.jerarquiaBloqueada = true;
    this.idPadreSeleccionado = targetId;

    const ruta: Modulo[] = [];
    let actual = this.modulosCompletos.find(m => Number(m.id) === Number(targetId)) || null;

    while (actual) {
      ruta.push(actual);
      if (actual.idpadre) {
        actual = this.modulosCompletos.find(m => Number(m.id) === Number(actual!.idpadre)) || null;
      } else {
        break;
      }
    }

    const jerarquia = ruta.reverse();
    const categoria = jerarquia[0];
    const modulo = jerarquia[1];
    const submodulo = jerarquia[2];
    const subsubmodulo = jerarquia[3];

    if (categoria) {
      this.nuevoModulo.categoria = categoria.id;
      this.modulosModal = this.modulosCompletos.filter(m => Number(m.idpadre) === Number(categoria.id));
    }

    if (modulo) {
      this.nuevoModulo.modulo = modulo.id;
      this.submodulosModal = this.modulosCompletos.filter(m => Number(m.idpadre) === Number(modulo.id));
    }

    if (submodulo) {
      this.nuevoModulo.submodulo = submodulo.id;
      this.subsubmodulosModal = this.modulosCompletos.filter(m => Number(m.idpadre) === Number(submodulo.id));
    }

    if (subsubmodulo) {
      this.nuevoModulo.subsubmodulo = subsubmodulo.id;
    }
  }

  editarModulo(modulo: Modulo) {
    this.editandoModulo = true;
    this.jerarquiaBloqueada = false;
    this.idPadreSeleccionado = null;
    this.nuevoModulo = { 
      id: modulo.id,
      nombre: modulo.nombre,
      descripcion: modulo.descripcion || '',
      categoria: null,
      modulo: null,
      submodulo: null,
      subsubmodulo: null
    };
    
    // Si tiene icono, mostrar preview
    if (modulo.icono) {
      this.previewUrl = `http://localhost:8000/storage/${modulo.icono}`;
    }
    
    // Determinar la jerarquía del padre
    if (modulo.idpadre) {
      const padre = this.modulosCompletos.find(m => Number(m.id) === Number(modulo.idpadre));
      if (padre) {
        // Determinar en qué nivel está el padre
        if (!padre.idpadre) {
          // El padre es una categoría raíz
          this.nuevoModulo.categoria = padre.id;
        } else {
          // El padre tiene padre, necesitamos subir la jerarquía
          const abuelo = this.modulosCompletos.find(m => Number(m.id) === Number(padre.idpadre));
          if (abuelo && !abuelo.idpadre) {
            // El abuelo es categoría raíz
            this.nuevoModulo.categoria = abuelo.id;
            this.onModalCategoriaChange();
            this.nuevoModulo.modulo = padre.id;
          } else if (abuelo && abuelo.idpadre) {
            // Hay más niveles
            const bisabuelo = this.modulosCompletos.find(m => Number(m.id) === Number(abuelo.idpadre));
            if (bisabuelo && !bisabuelo.idpadre) {
              this.nuevoModulo.categoria = bisabuelo.id;
              this.onModalCategoriaChange();
              this.nuevoModulo.modulo = abuelo.id;
              this.onModalModuloChange();
              this.nuevoModulo.submodulo = padre.id;
            }
          }
        }
      }
    }
    
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.editandoModulo = false;
    this.jerarquiaBloqueada = false;
    this.idPadreSeleccionado = null;
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onModalCategoriaChange() {
    this.nuevoModulo.modulo = null;
    this.nuevoModulo.submodulo = null;
    this.nuevoModulo.subsubmodulo = null;
    this.modulosModal = [];
    this.submodulosModal = [];
    this.subsubmodulosModal = [];

    if (this.nuevoModulo.categoria && this.modulosCompletos.length > 0) {
      const catId = Number(this.nuevoModulo.categoria);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === catId);
      
      // Aplicar filtro de permisos
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      
      this.modulosModal = hijos;
    }
  }

  onModalModuloChange() {
    this.nuevoModulo.submodulo = null;
    this.nuevoModulo.subsubmodulo = null;
    this.submodulosModal = [];
    this.subsubmodulosModal = [];

    if (this.nuevoModulo.modulo && this.modulosCompletos.length > 0) {
      const modId = Number(this.nuevoModulo.modulo);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === modId);
      
      // Aplicar filtro de permisos
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      
      this.submodulosModal = hijos;
    }
  }

  onModalSubmoduloChange() {
    this.nuevoModulo.subsubmodulo = null;
    this.subsubmodulosModal = [];

    if (this.nuevoModulo.submodulo && this.modulosCompletos.length > 0) {
      const submId = Number(this.nuevoModulo.submodulo);
      let hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === submId);
      
      // Aplicar filtro de permisos
      if (!this.isAdmin) {
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        hijos = hijos.filter(m => allowed.has(Number(m.id)));
      }
      
      this.subsubmodulosModal = hijos;
    }
  }

  guardarModulo() {
    if (!this.nuevoModulo.nombre) {
      alert('Por favor completa el nombre del módulo');
      return;
    }

    // Determinar el idpadre correcto según la selección
    let idpadre = null;
    if (this.jerarquiaBloqueada && this.idPadreSeleccionado) {
      idpadre = this.idPadreSeleccionado;
    } else {
      if (this.nuevoModulo.subsubmodulo) {
        idpadre = this.nuevoModulo.subsubmodulo;
      } else if (this.nuevoModulo.submodulo) {
        idpadre = this.nuevoModulo.submodulo;
      } else if (this.nuevoModulo.modulo) {
        idpadre = this.nuevoModulo.modulo;
      } else if (this.nuevoModulo.categoria) {
        idpadre = this.nuevoModulo.categoria;
      }
    }

    const formData = new FormData();
    formData.append('nombre', this.nuevoModulo.nombre);
    if (this.nuevoModulo.descripcion) {
      formData.append('descripcion', this.nuevoModulo.descripcion);
    }
    if (idpadre) {
      formData.append('idpadre', idpadre.toString());
    }
    if (this.selectedFile) {
      formData.append('icono', this.selectedFile, this.selectedFile.name);
    }

    if (this.editandoModulo) {
      this.categoriaService.updateModuloWithFile(this.nuevoModulo.id, formData).subscribe({
        next: () => {
          alert('Módulo actualizado exitosamente');
          this.cerrarFormulario();
          // Recargar permisos y luego datos
          this.authService.refreshUser().subscribe({
            next: () => {
              this.allowedModuleIds = this.authService.getAllowedModuleIds();
              this.cargarDatos();
            },
            error: () => this.cargarDatos()
          });
        },
        error: (error: any) => {
          console.error('Error al actualizar módulo:', error);
          alert('Error al actualizar el módulo');
        }
      });
    } else {
      this.categoriaService.createModuloWithFile(formData).subscribe({
        next: () => {
          alert('Módulo creado exitosamente');
          this.cerrarFormulario();
          console.log('🔄 Recargando permisos después de crear módulo...');
          // Recargar permisos y luego datos
          this.authService.refreshUser().subscribe({
            next: () => {
              const oldIds = [...this.allowedModuleIds];
              this.allowedModuleIds = this.authService.getAllowedModuleIds();
              console.log('✅ Permisos actualizados:', {
                before: oldIds,
                after: this.allowedModuleIds
              });
              this.cargarDatos();
            },
            error: (err) => {
              console.error('❌ Error al recargar permisos:', err);
              this.cargarDatos();
            }
          });
        },
        error: (error: any) => {
          console.error('Error al crear módulo:', error);
          alert('Error al crear el módulo');
        }
      });
    }
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (2MB)
      if (file.size > 2048000) {
        alert('El archivo es demasiado grande. Tamaño máximo: 2MB');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      this.selectedFile = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeIcon() {
    this.selectedFile = null;
    this.previewUrl = null;
    const fileInput = document.getElementById('modal-icono') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  eliminarModulo(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este módulo? Esto también eliminará todos sus submódulos.')) {
      this.categoriaService.deleteModulo(id).subscribe({
        next: () => {
          alert('Módulo eliminado exitosamente');
          this.cargarDatos();
          if (this.consultaRealizada) {
            this.buscarModulos();
          }
        },
        error: (error: any) => {
          console.error('Error al eliminar módulo:', error);
          alert('Error al eliminar el módulo');
        }
      });
    }
  }

  getNombrePadre(idpadre: number): string {
    const padre = this.modulosCompletos.find(m => m.id === idpadre);
    return padre ? padre.nombre : 'Desconocido';
  }

  private aplicarPermisosCategoriasModal(categorias: Modulo[]): Modulo[] {
    if (this.isAdmin) {
      return categorias;
    }

    // Para editores: solo mostrar categorías donde tienen módulos asignados
    const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
    const byId = new Map<number, Modulo>();
    this.modulosCompletos.forEach(m => byId.set(Number(m.id), m));

    // Incluir categorías ancestro de módulos permitidos
    const categoriasPermitidas = new Set<number>();
    
    allowed.forEach(id => {
      let current = byId.get(id);
      while (current) {
        if (!current.idpadre) {
          categoriasPermitidas.add(Number(current.id));
          break;
        }
        current = byId.get(Number(current.idpadre));
      }
    });

    return categorias.filter(c => categoriasPermitidas.has(Number(c.id)));
  }

  canEditModule(moduloId: number): boolean {
    if (this.isAdmin) return true;
    const canEdit = this.allowedModuleIds.includes(moduloId);
    console.log(`canEditModule(${moduloId}):`, {
      canEdit,
      allowedModuleIds: this.allowedModuleIds,
      isAdmin: this.isAdmin
    });
    return canEdit;
  }
}
