import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

interface Categoria {
  id?: number;
  nombre: string;
  descripcion?: string;
  orden?: number;
}

@Component({
  selector: 'app-admin-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="admin-categorias">
      <!-- ENCABEZADO -->
      <div class="page-header">
        <h2>Gestión de Categorías</h2>
        <p class="subtitle">Crea, edita y reordena las categorías del sistema</p>
      </div>

      <!-- Formulario de creación/edición -->
      <div class="form-section">
        <div class="form-section-header">
          <span class="form-section-icon">{{ editingCategoria ? '✏️' : '➕' }}</span>
          <h3>{{ editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría' }}</h3>
        </div>
        <form (ngSubmit)="guardarCategoria()">
          <div class="form-row">
            <div class="form-group">
              <label>Nombre <span class="required">*</span></label>
              <input 
                type="text" 
                [(ngModel)]="nuevaCategoria.nombre" 
                name="nombre"
                placeholder="Nombre de la categoría"
                required
              />
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <input 
                type="text"
                [(ngModel)]="nuevaCategoria.descripcion" 
                name="descripcion"
                placeholder="Descripción opcional"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              <span>{{ editingCategoria ? '💾' : '✚' }}</span>
              {{ editingCategoria ? 'Actualizar' : 'Crear Categoría' }}
            </button>
            <button type="button" class="btn-secondary" (click)="cancelarEdicion()">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <!-- Lista de categorías -->
      <div class="list-section">
        <div class="list-header">
          <div class="list-header-info">
            <h3>Categorías</h3>
            <span class="count-badge">{{ categorias.length }}</span>
          </div>
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="busqueda" 
              placeholder="Buscar categorías..."
              class="search-input"
            />
          </div>
        </div>

        <div *ngIf="ordenCambiado" class="orden-aviso">
          <span class="aviso-icon">⚠️</span>
          <span>Tienes cambios de orden sin guardar.</span>
          <div class="aviso-actions">
            <button class="btn-save-order" (click)="guardarOrden()">
              <span>💾</span> Guardar orden
            </button>
            <button class="btn-cancel-order" (click)="descartarOrden()">
              Descartar
            </button>
          </div>
        </div>

        <div class="categories-table">
          <table>
            <thead>
              <tr>
                <th class="col-drag"></th>
                <th class="col-id">ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th class="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody
              cdkDropList
              (cdkDropListDropped)="onDrop($event)"
              [cdkDropListDisabled]="!!busqueda"
            >
              <tr
                *ngFor="let categoria of categoriasFiltradas; let i = index"
                cdkDrag
                [cdkDragDisabled]="!!busqueda"
                class="drag-row"
              >
                <td class="col-drag">
                  <span cdkDragHandle class="drag-handle" title="Arrastrar para reordenar">⠿</span>
                </td>
                <td class="col-id">
                  <span class="id-badge">{{ categoria.id }}</span>
                </td>
                <td>
                  <span class="categoria-nombre">{{ categoria.nombre }}</span>
                </td>
                <td class="col-desc">{{ categoria.descripcion || '—' }}</td>
                <td class="col-actions">
                  <div class="action-buttons">
                    <button class="btn-edit" (click)="editarCategoria(categoria)">
                      ✏️ Editar
                    </button>
                    <button class="btn-delete" (click)="eliminarCategoria(categoria.id!)">
                      🗑️ Eliminar
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="categoriasFiltradas.length === 0">
                <td colspan="5" class="no-data">
                  <span class="no-data-icon">📁</span>
                  <p>No hay categorías{{ busqueda ? ' que coincidan con "' + busqueda + '"' : '' }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Base ── */
    .admin-categorias {
      max-width: 1200px;
      margin: 0 auto;
      padding: 28px 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
      border-left: 4px solid #6C5ECF;

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

    /* ── FORMULARIO ── */
    .form-section {
      background: white;
      padding: 26px 28px;
      border-radius: 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      margin-bottom: 24px;
    }

    .form-section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 22px;
      padding-bottom: 16px;
      border-bottom: 1.5px solid #F0F0F8;

      .form-section-icon { font-size: 20px; }

      h3 {
        margin: 0;
        color: #1A1A2E;
        font-size: 16px;
        font-weight: 700;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-bottom: 0;

      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    label {
      display: block;
      color: #3D3D5C;
      font-weight: 600;
      font-size: 13px;

      .required { color: #EF5350; margin-left: 2px; }
    }

    input, textarea {
      width: 100%;
      padding: 11px 14px;
      border: 1.5px solid #DDD8EF;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      background: #FAFAFE;
      color: #1A1A2E;
      transition: all 0.2s ease;

      &::placeholder { color: #B0B5C9; }

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
    }

    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    /* ── BOTONES ── */
    .btn-primary, .btn-secondary, .btn-edit, .btn-delete,
    .btn-save-order, .btn-cancel-order {
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

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
      }

      &:active { transform: translateY(0); }
    }

    .btn-primary {
      background: linear-gradient(135deg, #6C5ECF, #9B8AF0);
      color: white;
      box-shadow: 0 3px 10px rgba(108, 94, 207, 0.3);

      &:hover { box-shadow: 0 5px 16px rgba(108, 94, 207, 0.38); }
    }

    .btn-secondary {
      background: #F0F0F5;
      color: #5A5A72;

      &:hover { background: #E4E4EE; }
    }

    .btn-edit {
      background: linear-gradient(135deg, #2196F3, #1565C0);
      color: white;
      padding: 7px 14px;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(33,150,243,0.2);

      &:hover { box-shadow: 0 4px 12px rgba(33,150,243,0.32); }
    }

    .btn-delete {
      background: linear-gradient(135deg, #EF5350, #C62828);
      color: white;
      padding: 7px 14px;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(239,83,80,0.2);

      &:hover { box-shadow: 0 4px 12px rgba(239,83,80,0.32); }
    }

    /* ── SECCIÓN LISTA ── */
    .list-section {
      background: white;
      padding: 26px 28px;
      border-radius: 18px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1.5px solid #F0F0F8;
      flex-wrap: wrap;
      gap: 14px;

      .list-header-info {
        display: flex;
        align-items: center;
        gap: 12px;

        h3 {
          margin: 0;
          color: #1A1A2E;
          font-size: 17px;
          font-weight: 700;
        }

        .count-badge {
          background: #F0EDFF;
          color: #6C5ECF;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }
      }
    }

    .search-bar {
      position: relative;
      display: flex;
      align-items: center;

      .search-icon {
        position: absolute;
        left: 12px;
        font-size: 14px;
        pointer-events: none;
      }

      .search-input {
        padding: 9px 14px 9px 34px;
        width: 240px;
        border: 1.5px solid #DDD8EF;
        border-radius: 10px;
        font-size: 13px;
        background: #FAFAFE;
        color: #1A1A2E;
        font-family: inherit;
        transition: all 0.2s ease;

        &::placeholder { color: #B0B5C9; }

        &:focus {
          outline: none;
          border-color: #6C5ECF;
          background: white;
          box-shadow: 0 0 0 3px rgba(108, 94, 207, 0.1);
          width: 280px;
        }
      }
    }

    /* ── AVISO ORDEN ── */
    .orden-aviso {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #FFF8E1;
      border: 1px solid #FFD54F;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 13px;
      font-weight: 500;
      color: #795548;

      .aviso-icon { font-size: 16px; flex-shrink: 0; }

      span { flex: 1; }

      .aviso-actions { display: flex; gap: 8px; margin-left: auto; }
    }

    .btn-save-order {
      background: linear-gradient(135deg, #6C5ECF, #9B8AF0);
      color: white;
      padding: 7px 14px;
      font-size: 12px;
      box-shadow: 0 2px 6px rgba(108,94,207,0.2);
    }

    .btn-cancel-order {
      background: #F0F0F5;
      color: #5A5A72;
      padding: 7px 14px;
      font-size: 12px;
    }

    /* ── TABLA ── */
    .categories-table {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid #EBEBF5;
    }

    table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: #F7F6FB;

        th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #8A8FA8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          border-bottom: 1.5px solid #EBEBF5;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #F0F0F8;
          transition: background-color 0.15s ease;

          &:last-child { border-bottom: none; }

          &:hover { background: #FAFAFE; }

          td {
            padding: 13px 16px;
            color: #3D3D5C;
            font-size: 14px;
            vertical-align: middle;
          }
        }
      }
    }

    .col-drag { width: 44px; text-align: center; }
    .col-id   { width: 70px; }
    .col-desc { color: #8A8FA8 !important; font-size: 13px !important; }
    .col-actions { width: 160px; text-align: right; }

    .id-badge {
      background: #F0EDFF;
      color: #6C5ECF;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      font-family: 'Monaco', monospace;
    }

    .categoria-nombre {
      font-weight: 600;
      color: #1A1A2E;
    }

    .action-buttons {
      display: flex;
      gap: 7px;
      justify-content: flex-end;
    }

    /* ── DRAG & DROP ── */
    .drag-handle {
      cursor: grab;
      font-size: 18px;
      color: #C8C8D8;
      user-select: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      transition: all 0.15s ease;

      &:hover {
        color: #6C5ECF;
        background: #F0EDFF;
      }

      &:active { cursor: grabbing; }
    }

    .drag-row {
      transition: background-color 0.15s ease;

      &.cdk-drag-preview {
        box-shadow: 0 8px 28px rgba(108, 94, 207, 0.2);
        background: white;
        border-radius: 10px;
        opacity: 0.98;
        display: table;
        table-layout: fixed;
        width: 100%;
      }

      &.cdk-drag-placeholder { opacity: 0; }

      &.cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    }

    .cdk-drop-list-dragging .drag-row:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* ── EMPTY STATE ── */
    .no-data {
      text-align: center;
      padding: 48px 20px !important;

      .no-data-icon {
        font-size: 40px;
        display: block;
        margin-bottom: 12px;
        opacity: 0.6;
      }

      p {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #8A8FA8;
      }
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .list-header {
        flex-direction: column;
        align-items: flex-start;

        .search-bar { width: 100%; .search-input { width: 100%; } }
      }

      .col-desc { display: none; }
      .col-id   { display: none; }
    }
  `]
})
export class AdminCategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  busqueda = '';
  ordenCambiado = false;
  
  editingCategoria: Categoria | null = null;
  nuevaCategoria: Categoria = {
    nombre: '',
    descripcion: ''
  };

  constructor(
    private categoriaService: CategoriaService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data: any[]) => {
        this.categorias = data.sort((a, b) => (a.orden ?? a.id) - (b.orden ?? b.id));
        this.ordenCambiado = false;
      },
      error: (error: any) => {
        console.error('Error al cargar categorías:', error);
      }
    });
  }

  guardarCategoria() {
    if (!this.nuevaCategoria.nombre) {
      this.toast.warning('Por favor completa el nombre de la categoría');
      return;
    }

    if (this.editingCategoria) {
      this.categoriaService.updateCategoria(this.editingCategoria.id!, this.nuevaCategoria).subscribe({
        next: () => {
          this.toast.success('Categoría actualizada exitosamente');
          this.cargarCategorias();
          this.resetForm();
        },
        error: (error: any) => {
          console.error('Error al actualizar categoría:', error);
          this.toast.error('Error al actualizar la categoría');
        }
      });
    } else {
      this.categoriaService.createCategoria(this.nuevaCategoria).subscribe({
        next: () => {
          this.toast.success('Categoría creada exitosamente');
          this.cargarCategorias();
          this.resetForm();
        },
        error: (error: any) => {
          console.error('Error al crear categoría:', error);
          this.toast.error('Error al crear la categoría');
        }
      });
    }
  }

  editarCategoria(categoria: Categoria) {
    this.editingCategoria = categoria;
    this.nuevaCategoria = { ...categoria };
  }

  cancelarEdicion() {
    this.resetForm();
  }

  eliminarCategoria(id: number) {
    this.toast.confirm('¿Estás seguro de que deseas eliminar esta categoría?').then(ok => {
      if (!ok) return;
      this.categoriaService.deleteCategoria(id).subscribe({
        next: () => {
          this.toast.success('Categoría eliminada exitosamente');
          this.cargarCategorias();
        },
        error: (error: any) => {
          console.error('Error al eliminar categoría:', error);
          this.toast.error('Error al eliminar la categoría');
        }
      });
    });
  }

  resetForm() {
    this.nuevaCategoria = {
      nombre: '',
      descripcion: ''
    };
    this.editingCategoria = null;
  }

  onDrop(event: CdkDragDrop<Categoria[]>) {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.categorias, event.previousIndex, event.currentIndex);
    this.ordenCambiado = true;
  }

  guardarOrden() {
    const items = this.categorias.map((cat, index) => ({
      id: cat.id!,
      orden: index
    }));
    this.categoriaService.reordenarCategorias(items).subscribe({
      next: () => {
        this.ordenCambiado = false;
        this.toast.success('Orden guardado correctamente');
      },
      error: (error: any) => {
        console.error('Error al guardar el orden:', error);
        this.toast.error('Error al guardar el orden');
      }
    });
  }

  descartarOrden() {
    this.cargarCategorias();
  }

  get categoriasFiltradas(): Categoria[] {
    if (!this.busqueda) {
      return this.categorias;
    }
    return this.categorias.filter(c =>
      c.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(this.busqueda.toLowerCase()))
    );
  }
}
