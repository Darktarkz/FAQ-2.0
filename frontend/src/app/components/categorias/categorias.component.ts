import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CategoriaService, Categoria } from '../../services/categoria.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  loading = true;
  error: string | null = null;

  // Categorías por defecto si la BD no devuelve datos
  categoriasDefault: Categoria[] = [
    {
      id: 1,
      nombre: 'Misional',
      descripcion: 'Actividades principales de la organización',
      icono: '🎯'
    },
    {
      id: 2,
      nombre: 'Estratégico',
      descripcion: 'Procesos de planificación y dirección',
      icono: '📋'
    },
    {
      id: 3,
      nombre: 'Administrativo',
      descripcion: 'Gestión administrativa y operativa',
      icono: '⚙️'
    }
  ];

  constructor(private categoriaService: CategoriaService, private router: Router) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.categorias = data;
        } else {
          this.categorias = this.categoriasDefault;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
        this.categorias = this.categoriasDefault;
        this.loading = false;
      }
    });
  }

  irAModulos(categoriaId: number): void {
    if (!categoriaId) {
      console.error('Error: categoriaId es undefined', categoriaId);
      this.error = 'No se pudo cargar esta categoría. Verifica los datos.';
      return;
    }
    console.log('Navegando a módulos con id:', categoriaId);
    this.router.navigate(['/modulos', categoriaId]);
  }
}
