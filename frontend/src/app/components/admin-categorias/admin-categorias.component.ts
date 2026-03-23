import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

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
      <h2>Gestión de Categorías</h2>

      <!-- Formulario de creación/edición -->
      <div class="form-section">
        <h3>{{ editingCategoria ? 'Editar Categoría' : 'Crear Nueva Categoría' }}</h3>
        <form (ngSubmit)="guardarCategoria()">
          <div class="form-group">
            <label>Nombre:</label>
            <input 
              type="text" 
              [(ngModel)]="nuevaCategoria.nombre" 
              name="nombre"
              required
            />
          </div>

          <div class="form-group">
            <label>Descripción:</label>
            <textarea 
              [(ngModel)]="nuevaCategoria.descripcion" 
              name="descripcion"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">
              {{ editingCategoria ? 'Actualizar' : 'Crear' }}
            </button>
            <button type="button" class="btn-secondary" (click)="cancelarEdicion()">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <!-- Lista de categorías -->
      <div class="list-section">
        <h3>Categorías Existentes</h3>
        <div class="search-bar">
          <input 
            type="text" 
            [(ngModel)]="busqueda" 
            placeholder="Buscar categorías..."
            class="search-input"
          />
        </div>

        <div *ngIf="ordenCambiado" class="orden-aviso">
          <span>⚠ Tienes cambios de orden sin guardar.</span>
          <button class="btn-save-order" (click)="guardarOrden()">Guardar orden</button>
          <button class="btn-cancel-order" (click)="descartarOrden()">Descartar</button>
        </div>

        <div class="categories-table">
          <table>
            <thead>
              <tr>
                <th class="col-drag"></th>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody
              cdkDropList
              (cdkDropListDropped)="onDrop($event)"
              [cdkDropListDisabled]="!!busqueda"
            >
              <tr
                *ngFor="let categoria of categoriasFiltradas"
                cdkDrag
                [cdkDragDisabled]="!!busqueda"
                class="drag-row"
              >
                <td class="col-drag">
                  <span cdkDragHandle class="drag-handle" title="Arrastrar para reordenar">⠿</span>
                </td>
                <td>{{ categoria.id }}</td>
                <td>{{ categoria.nombre }}</td>
                <td>{{ categoria.descripcion || '-' }}</td>
                <td>
                  <button class="btn-edit" (click)="editarCategoria(categoria)">Editar</button>
                  <button class="btn-delete" (click)="eliminarCategoria(categoria.id!)">Eliminar</button>
                </td>
              </tr>
              <tr *ngIf="categoriasFiltradas.length === 0">
                <td colspan="5" class="no-data">No hay categorías</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-categorias {
      max-width: 1200px;
      margin: 20px auto;
      padding: 20px;
    }

    h2 {
      color: #333;
      margin-bottom: 30px;
    }

    h3 {
      color: #555;
      margin-bottom: 20px;
    }

    .form-section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-bottom: 40px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    input, textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

    .btn-primary, .btn-secondary, .btn-edit, .btn-delete {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background-color: #667eea;
      color: white;

      &:hover {
        background-color: #5568d3;
      }
    }

    .btn-secondary {
      background-color: #e0e0e0;
      color: #333;

      &:hover {
        background-color: #d0d0d0;
      }
    }

    .btn-edit {
      background-color: #4CAF50;
      color: white;

      &:hover {
        background-color: #45a049;
      }
    }

    .btn-delete {
      background-color: #f44336;
      color: white;

      &:hover {
        background-color: #da190b;
      }
    }

    .list-section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .search-bar {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
      max-width: 300px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;

      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }

    .categories-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;

      thead {
        background-color: #f5f5f5;

        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #ddd;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #eee;

          &:hover {
            background-color: #f9f9f9;
          }

          td {
            padding: 12px;
            color: #666;
          }
        }
      }
    }

    .no-data {
      text-align: center;
      color: #999;
      font-style: italic;
    }

    .col-drag {
      width: 40px;
      text-align: center;
    }

    .drag-handle {
      cursor: grab;
      font-size: 20px;
      color: #aaa;
      user-select: none;
      display: inline-block;
      padding: 4px 8px;

      &:hover {
        color: #667eea;
      }

      &:active {
        cursor: grabbing;
      }
    }

    .drag-row {
      transition: background-color 0.15s ease;

      &.cdk-drag-preview {
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        background: #fff;
        border-radius: 4px;
        opacity: 0.95;
      }

      &.cdk-drag-placeholder {
        opacity: 0;
      }

      &.cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    }

    .cdk-drop-list-dragging .drag-row:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .orden-aviso {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-radius: 6px;
      padding: 10px 16px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #795548;
    }

    .btn-save-order {
      background-color: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 13px;

      &:hover {
        background-color: #5568d3;
      }
    }

    .btn-cancel-order {
      background-color: #e0e0e0;
      color: #333;
      border: none;
      border-radius: 4px;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 13px;

      &:hover {
        background-color: #d0d0d0;
      }
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
    private router: Router
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
      alert('Por favor completa el nombre de la categoría');
      return;
    }

    if (this.editingCategoria) {
      this.categoriaService.updateCategoria(this.editingCategoria.id!, this.nuevaCategoria).subscribe({
        next: () => {
          alert('Categoría actualizada exitosamente');
          this.cargarCategorias();
          this.resetForm();
        },
        error: (error: any) => {
          console.error('Error al actualizar categoría:', error);
          alert('Error al actualizar la categoría');
        }
      });
    } else {
      this.categoriaService.createCategoria(this.nuevaCategoria).subscribe({
        next: () => {
          alert('Categoría creada exitosamente');
          this.cargarCategorias();
          this.resetForm();
        },
        error: (error: any) => {
          console.error('Error al crear categoría:', error);
          alert('Error al crear la categoría');
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
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      this.categoriaService.deleteCategoria(id).subscribe({
        next: () => {
          alert('Categoría eliminada exitosamente');
          this.cargarCategorias();
        },
        error: (error: any) => {
          console.error('Error al eliminar categoría:', error);
          alert('Error al eliminar la categoría');
        }
      });
    }
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
        alert('Orden guardado correctamente');
      },
      error: (error: any) => {
        console.error('Error al guardar el orden:', error);
        alert('Error al guardar el orden');
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
