import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PreguntaService, Pregunta } from '../../services/pregunta.service';
import { CategoriaService, Modulo } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-preguntas',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './preguntas.component.html',
  styleUrl: './preguntas.component.css'
})
export class PreguntasComponent implements OnInit {
  categorias: Modulo[] = [];
  modulosCompletos: Modulo[] = [];
  preguntas: Pregunta[] = [];
  preguntasFiltradas: Pregunta[] = [];
  
  // Navegación jerárquica
  categoriaSeleccionada: Modulo | null = null;
  modulosActuales: Modulo[] = [];
  breadcrumb: Modulo[] = [];
  
  // UI
  loading = false;
  error = '';
  preguntaExpandida: number | null = null;

  constructor(
    private preguntaService: PreguntaService,
    private categoriaService: CategoriaService,
    public authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    
    // Cargar categorías raíz
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar categorías';
        this.loading = false;
      }
    });

    // Cargar todos los módulos para navegación
    this.categoriaService.getModulos().subscribe({
      next: (data) => {
        this.modulosCompletos = data.map(m => ({
          ...m,
          id: Number(m.id),
          idpadre: m.idpadre ? Number(m.idpadre) : null
        }));
      },
      error: (error) => {
        console.error('Error al cargar módulos:', error);
      }
    });

    // Cargar todas las preguntas
    this.preguntaService.getPreguntas().subscribe({
      next: (data) => {
        this.preguntas = data;
      },
      error: (error) => {
        console.error('Error al cargar preguntas:', error);
      }
    });
  }

  seleccionarCategoria(categoria: Modulo) {
    this.categoriaSeleccionada = categoria;
    this.breadcrumb = [categoria];
    this.cargarModulosHijos(categoria.id!);
  }

  seleccionarModulo(modulo: Modulo) {
    this.breadcrumb.push(modulo);
    this.cargarModulosHijos(modulo.id!);
  }

  cargarModulosHijos(idPadre: number) {
    const hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === idPadre);
    
    if (hijos.length > 0) {
      // Hay submódulos, mostrarlos
      this.modulosActuales = hijos;
      this.preguntasFiltradas = [];
    } else {
      // No hay más submódulos, mostrar preguntas
      this.modulosActuales = [];
      this.filtrarPreguntas(idPadre);
    }
  }

  filtrarPreguntas(idModulo: number) {
    // Obtener todos los IDs de la jerarquía (el módulo actual y todos sus descendientes)
    const idsJerarquia = this.obtenerTodosLosSubmódulos(idModulo);
    
    this.preguntasFiltradas = this.preguntas.filter(p => 
      idsJerarquia.includes(p.Idmodulo || 0)
    );
  }

  obtenerTodosLosSubmódulos(moduloId: number): number[] {
    const resultado: number[] = [];
    
    const procesar = (id: number) => {
      resultado.push(id);
      const hijos = this.modulosCompletos.filter(m => Number(m.idpadre) === id);
      hijos.forEach(hijo => procesar(Number(hijo.id)));
    };

    procesar(moduloId);
    return resultado;
  }

  navegarBreadcrumb(index: number) {
    // Retroceder en la navegación
    this.breadcrumb = this.breadcrumb.slice(0, index + 1);
    const ultimoItem = this.breadcrumb[this.breadcrumb.length - 1];
    this.cargarModulosHijos(ultimoItem.id!);
  }

  retroceder() {
    if (this.breadcrumb.length > 1) {
      // Si hay más de un nivel, retroceder un nivel
      this.navegarBreadcrumb(this.breadcrumb.length - 2);
    } else if (this.breadcrumb.length === 1) {
      // Si solo hay la categoría, volver al inicio
      this.volverInicio();
    }
  }

  volverInicio() {
    this.categoriaSeleccionada = null;
    this.breadcrumb = [];
    this.modulosActuales = [];
    this.preguntasFiltradas = [];
  }

  togglePregunta(index: number) {
    this.preguntaExpandida = this.preguntaExpandida === index ? null : index;
  }

  getIconUrl(icono: string): string {
    return `http://localhost:8000/storage/${icono}`;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
        this.authService.logoutLocal();
        this.router.navigate(['/login']);
      }
    });
  }

  sanitizar(texto: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(texto || '');
  }
}
