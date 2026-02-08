import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CategoriaService, Modulo, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './modulos.component.html',
  styleUrls: ['./modulos.component.css']
})
export class ModulosComponent implements OnInit {
  modulos: Modulo[] = [];
  categoria: Categoria | null = null;
  categoriaId: number = 0;
  moduloPadreId: number | null = null;
  moduloPadre: Modulo | null = null;
  loading = true;
  error: string | null = null;
  breadcrumbs: Array<{ id: number; nombre: string }> = [];
  
  // Map para almacenar qué módulos tienen submódulos
  modulosConHijos: Map<number, boolean> = new Map();
  
  // Formulario de módulo
  showForm = false;
  isEditing = false;
  editingId: number | null = null;
  todosLosModulos: Modulo[] = [];
  
  // Dropdowns en cascada
  categorias: Modulo[] = [];  // Módulos sin padre (nivel 1)
  modulosNivel2: Modulo[] = [];
  modulosNivel3: Modulo[] = [];
  modulosNivel4: Modulo[] = [];
  
  form = {
    nombre: '',
    descripcion: '',
    categoriaId: null as number | null,
    moduloNivel2Id: null as number | null,
    moduloNivel3Id: null as number | null,
    moduloNivel4Id: null as number | null,
    idpadre: null as number | null
  };

  constructor(
    private categoriaService: CategoriaService,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      
      // Convertir a número
      this.categoriaId = Number(id);
      this.cargarModulos();
    });
  }

  cargarCategoria(): void {
    // Método ya no se usa - obtenemos la info de los módulos filtrados
  }

  cargarModulos(): void {
    this.loading = true;
    this.error = null;

    // Cargar todos los módulos que tengan idpadre = categoriaId
    this.categoriaService.getModulosPorCategoria(this.categoriaId).subscribe({
      next: (data) => {
        this.modulos = data || [];
        
        // Verificar para cada módulo si tiene submódulos
        this.verificarModulosConHijos();
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar módulos:', err);
        this.error = 'No se pudieron cargar los módulos. Verifica que sea correcto.';
        this.modulos = [];
        this.loading = false;
      }
    });
  }

  /**
   * Verifica cuáles módulos tienen submódulos
   */
  verificarModulosConHijos(): void {
    // Obtener todos los módulos para verificar relaciones
    this.categoriaService.getModulos().subscribe({
      next: (todosModulos) => {
        // Para cada módulo en la lista actual, verificar si tiene hijos
        this.modulos.forEach(modulo => {
          const tieneHijos = todosModulos.some(m => m.idpadre === modulo.id);
          this.modulosConHijos.set(modulo.id, tieneHijos);
          console.log(`Módulo ${modulo.id} (${modulo.nombre}): tieneHijos=${tieneHijos}`);
        });
      },
      error: (err) => {
        console.error('Error al verificar submódulos:', err);
      }
    });
  }

  /**
   * Verifica si un módulo tiene submódulos
   */
  tieneSubmodulos(moduloId: number): boolean {
    return this.modulosConHijos.get(moduloId) || false;
  }

  regresarCategories(): void {
    this.router.navigate(['/categorias']);
  }

  regresarModulo(): void {
    // Regresar a categorías
    this.router.navigate(['/categorias']);
  }

  irASubmodulos(moduloId: number): void {
    this.router.navigate(['/modulos', moduloId]);
  }

  irAPreguntas(moduloId: number): void {
    this.router.navigate(['/preguntas', moduloId]);
  }

  // Verificar si un módulo tiene hijos
  tieneHijos(modulo: Modulo): boolean {
    // Aquí podrías agregar lógica para verificar si tiene submódulos
    // Por ahora, asumir que todos pueden tener hijos
    return true;
  }
  
  // Métodos del formulario
  openForm(modulo?: Modulo): void {
    // Cargar todos los módulos para los dropdowns
    this.cargarTodosLosModulos();
    
    if (modulo) {
      this.isEditing = true;
      this.editingId = modulo.id || null;
      this.form = {
        nombre: modulo.nombre,
        descripcion: modulo.descripcion || '',
        categoriaId: null,
        moduloNivel2Id: null,
        moduloNivel3Id: null,
        moduloNivel4Id: null,
        idpadre: modulo.idpadre || null
      };
      // Si está editando, pre-cargar la jerarquía
      if (modulo.idpadre) {
        this.cargarJerarquiaParaEdicion(modulo.idpadre);
      }
    } else {
      this.isEditing = false;
      this.editingId = null;
      this.resetForm();
    }
    this.showForm = true;
  }
  
  closeForm(): void {
    this.showForm = false;
    this.error = null;
    this.resetForm();
  }
  
  resetForm(): void {
    this.form = {
      nombre: '',
      descripcion: '',
      categoriaId: null,
      moduloNivel2Id: null,
      moduloNivel3Id: null,
      moduloNivel4Id: null,
      idpadre: null
    };
    this.modulosNivel2 = [];
    this.modulosNivel3 = [];
    this.modulosNivel4 = [];
  }
  
  saveModulo(): void {
    if (!this.form.nombre.trim()) {
      this.error = 'El nombre del módulo es requerido';
      return;
    }
    
    if (this.isEditing && this.editingId) {
      this.updateModulo();
    } else {
      this.createModulo();
    }
  }
  
  createModulo(): void {
    const nuevoModulo = {
      nombre: this.form.nombre,
      descripcion: this.form.descripcion || undefined,
      idpadre: this.form.idpadre || undefined
    };
    
    this.categoriaService.createModulo(nuevoModulo as any).subscribe({
      next: () => {
        this.cargarModulos();
        this.closeForm();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear el módulo';
      }
    });
  }
  
  updateModulo(): void {
    if (this.editingId) {
      const moduloActualizado = {
        nombre: this.form.nombre,
        descripcion: this.form.descripcion || undefined,
        idpadre: this.form.idpadre || undefined
      };
      
      this.categoriaService.updateModulo(this.editingId, moduloActualizado as any).subscribe({
        next: () => {
          this.cargarModulos();
          this.closeForm();
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al actualizar el módulo';
        }
      });
    }
  }
  
  deleteModulo(modulo: Modulo): void {
    if (!modulo.id || !confirm(`¿Estás seguro de que deseas eliminar "${modulo.nombre}"?`)) {
      return;
    }
    
    this.categoriaService.deleteModulo(modulo.id).subscribe({
      next: () => {
        this.cargarModulos();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al eliminar el módulo';
      }
    });
  }
  
  cargarTodosLosModulos(): void {
    this.categoriaService.getModulos().subscribe({
      next: (data) => {
        this.todosLosModulos = data || [];
        // Filtrar categorías (módulos sin padre)
        this.categorias = this.todosLosModulos.filter(m => !m.idpadre);
      },
      error: (err) => {
        console.error('Error al cargar módulos:', err);
      }
    });
  }
  
  onCategoriaChange(): void {
    this.form.moduloNivel2Id = null;
    this.form.moduloNivel3Id = null;
    this.form.moduloNivel4Id = null;
    this.modulosNivel2 = [];
    this.modulosNivel3 = [];
    this.modulosNivel4 = [];
    
    if (this.form.categoriaId) {
      this.modulosNivel2 = this.todosLosModulos.filter(
        m => m.idpadre === this.form.categoriaId
      );
      this.form.idpadre = this.form.categoriaId;
    } else {
      this.form.idpadre = null;
    }
  }
  
  onModuloNivel2Change(): void {
    this.form.moduloNivel3Id = null;
    this.form.moduloNivel4Id = null;
    this.modulosNivel3 = [];
    this.modulosNivel4 = [];
    
    if (this.form.moduloNivel2Id) {
      this.modulosNivel3 = this.todosLosModulos.filter(
        m => m.idpadre === this.form.moduloNivel2Id
      );
      this.form.idpadre = this.form.moduloNivel2Id;
    } else if (this.form.categoriaId) {
      this.form.idpadre = this.form.categoriaId;
    }
  }
  
  onModuloNivel3Change(): void {
    this.form.moduloNivel4Id = null;
    this.modulosNivel4 = [];
    
    if (this.form.moduloNivel3Id) {
      this.modulosNivel4 = this.todosLosModulos.filter(
        m => m.idpadre === this.form.moduloNivel3Id
      );
      this.form.idpadre = this.form.moduloNivel3Id;
    } else if (this.form.moduloNivel2Id) {
      this.form.idpadre = this.form.moduloNivel2Id;
    }
  }
  
  onModuloNivel4Change(): void {
    if (this.form.moduloNivel4Id) {
      this.form.idpadre = this.form.moduloNivel4Id;
    } else if (this.form.moduloNivel3Id) {
      this.form.idpadre = this.form.moduloNivel3Id;
    }
  }
  
  cargarJerarquiaParaEdicion(idPadre: number): void {
    // Buscar el padre y reconstruir la jerarquía
    const padre = this.todosLosModulos.find(m => m.id === idPadre);
    if (!padre) return;
    
    // Determinar el nivel del padre
    if (!padre.idpadre) {
      // Es una categoría
      this.form.categoriaId = padre.id;
      this.onCategoriaChange();
    } else {
      // Buscar su padre recursivamente
      const abuelo = this.todosLosModulos.find(m => m.id === padre.idpadre);
      if (abuelo && !abuelo.idpadre) {
        // El padre es nivel 2
        this.form.categoriaId = abuelo.id;
        this.onCategoriaChange();
        this.form.moduloNivel2Id = padre.id;
        this.onModuloNivel2Change();
      } else if (abuelo && abuelo.idpadre) {
        // El padre es nivel 3 o más
        const bisabuelo = this.todosLosModulos.find(m => m.id === abuelo.idpadre);
        if (bisabuelo && !bisabuelo.idpadre) {
          this.form.categoriaId = bisabuelo.id;
          this.onCategoriaChange();
          this.form.moduloNivel2Id = abuelo.id;
          this.onModuloNivel2Change();
          this.form.moduloNivel3Id = padre.id;
          this.onModuloNivel3Change();
        }
      }
    }
  }
  
  getNombreModuloPadre(idPadre: number | null): string {
    if (!idPadre) return 'Raíz / Categoría principal';
    
    const modulo = this.todosLosModulos.find(m => m.id === idPadre);
    if (!modulo) return 'Desconocido';
    
    // Construir ruta completa
    let ruta = modulo.nombre;
    let actual = modulo;
    
    while (actual.idpadre) {
      const padre = this.todosLosModulos.find(m => m.id === actual.idpadre);
      if (padre) {
        ruta = padre.nombre + ' > ' + ruta;
        actual = padre;
      } else {
        break;
      }
    }
    
    return ruta;
  }
  
  getVistaPrevia(): string {
    if (!this.form.idpadre) {
      return 'Se creará como categoría principal en la página de inicio';
    }
    return `Se creará dentro de: ${this.getNombreModuloPadre(this.form.idpadre)}`;
  }
}
