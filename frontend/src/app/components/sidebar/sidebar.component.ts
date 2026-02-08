import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CategoriaService, Modulo } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isExpanded = false;
  showAddModuloModal = false;
  modulos: Modulo[] = [];
  modulosPadre: Modulo[] = [];
  loading = false;
  error: string | null = null;

  // Formulario
  nuevoModulo = {
    nombre: '',
    descripcion: '',
    idpadre: null as number | null
  };

  constructor(
    private categoriaService: CategoriaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarModulos();
  }

  cargarModulos(): void {
    this.categoriaService.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
        // Mostrar todos los módulos como opciones de padre
        this.modulosPadre = data;
      },
      error: (err) => {
        console.error('Error al cargar módulos:', err);
      }
    });
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  openAddModuloModal(): void {
    this.showAddModuloModal = true;
    this.resetFormulario();
    this.cargarModulos();
  }

  closeAddModuloModal(): void {
    this.showAddModuloModal = false;
    this.resetFormulario();
  }

  resetFormulario(): void {
    this.nuevoModulo = {
      nombre: '',
      descripcion: '',
      idpadre: null
    };
    this.error = null;
  }

  agregarModulo(): void {
    if (!this.nuevoModulo.nombre.trim()) {
      this.error = 'El nombre del módulo es requerido';
      return;
    }

    this.loading = true;
    this.error = null;

    this.categoriaService.createModulo({
      nombre: this.nuevoModulo.nombre,
      descripcion: this.nuevoModulo.descripcion || undefined,
      idpadre: this.nuevoModulo.idpadre || undefined
    } as any).subscribe({
      next: (data) => {
        console.log('Módulo creado:', data);
        this.loading = false;
        this.closeAddModuloModal();
        this.cargarModulos();
        alert('✅ Módulo creado exitosamente');
      },
      error: (err) => {
        console.error('Error al crear módulo:', err);
        this.error = err.error?.message || 'Error al crear el módulo';
        this.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        console.error('Error al cerrar sesión:', error);
        this.authService.logoutLocal();
        this.router.navigate(['/login']);
      }
    });
  }

  irA(ruta: string): void {
    this.router.navigate([ruta]);
    this.isExpanded = false;
  }

  // Obtener nombre del módulo padre seleccionado
  getNombreModuloPadre(idpadre: number | null): string {
    if (!idpadre) return 'Sin padre (Categoría raíz)';
    const padre = this.modulos.find(m => m.id === idpadre);
    return padre ? padre.nombre : 'Seleccionar padre';
  }
}
