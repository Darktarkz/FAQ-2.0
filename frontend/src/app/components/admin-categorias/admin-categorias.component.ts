import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

interface Categoria {
  id?: number;
  nombre: string;
  descripcion?: string;
}

@Component({
  selector: 'app-admin-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

        <div class="categories-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let categoria of categoriasFiltradas">
                <td>{{ categoria.id }}</td>
                <td>{{ categoria.nombre }}</td>
                <td>{{ categoria.descripcion || '-' }}</td>
                <td>
                  <button class="btn-edit" (click)="editarCategoria(categoria)">Editar</button>
                  <button class="btn-delete" (click)="eliminarCategoria(categoria.id!)">Eliminar</button>
                </td>
              </tr>
              <tr *ngIf="categoriasFiltradas.length === 0">
                <td colspan="4" class="no-data">No hay categorías</td>
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
  `]
})
export class AdminCategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  busqueda = '';
  
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
        this.categorias = data;
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
