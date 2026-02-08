import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { LoadingComponent } from '../loading/loading.component';

export interface Categoria {
  id?: number;
  MODULOS?: string;
  Modulos?: string;
  idMODULOS?: number;
  Descripcion?: string;
  DESCRIPCION?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-faq-public',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent],
  template: `
    <div class="faq-public-container">
      <header class="faq-top-bar">
        <div class="top-bar-content">
          <a [routerLink]="['/faq']" class="logo">
            <span class="icon">❓</span> FAQ
          </a>
          <a [routerLink]="['/login']" class="btn-login">
            Iniciar sesión
          </a>
        </div>
      </header>

      <header class="faq-header">
        <h1>Preguntas Frecuentes</h1>
        <p>Encuentra respuestas a las preguntas más comunes</p>
      </header>

      <main class="faq-main">
        <div class="categories-grid" *ngIf="!loading && categorias.length > 0">
          <div class="category-card" *ngFor="let categoria of categorias">
            <h3>{{ getNombre(categoria) }}</h3>
            <p>{{ getDescripcion(categoria) }}</p>
            <a [routerLink]="['/faq/modulos', categoria.id]" class="btn-primary">
              Explorar
            </a>
          </div>
        </div>

        <div class="empty-state" *ngIf="!loading && categorias.length === 0">
          <p>No hay categorías disponibles</p>
        </div>

        <app-loading *ngIf="loading"></app-loading>
      </main>
    </div>
  `,
  styles: [`
    .faq-public-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .faq-top-bar {
      background: rgba(0, 0, 0, 0.3);
      padding: 15px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .top-bar-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      color: white;
      text-decoration: none;
      font-size: 1.3em;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;

      .icon {
        font-size: 1.3em;
      }

      &:hover {
        opacity: 0.8;
      }
    }

    .btn-login {
      display: inline-block;
      background: white;
      color: #667eea;
      padding: 8px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      transition: all 0.3s ease;

      &:hover {
        background: #f0f0f0;
        transform: translateY(-2px);
      }
    }

    .faq-header {
      background: rgba(0, 0, 0, 0.2);
      color: white;
      padding: 60px 20px;
      text-align: center;

      h1 {
        font-size: 2.5em;
        margin: 0 0 10px 0;
      }

      p {
        font-size: 1.2em;
        margin: 0;
        opacity: 0.9;
      }
    }

    .faq-main {
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .category-card {
      background: white;
      border-radius: 8px;
      padding: 25px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
      }

      h3 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 1.3em;
      }

      p {
        color: #666;
        margin: 0 0 20px 0;
        line-height: 1.5;
      }
    }

    .btn-primary {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
      transition: background 0.3s ease;

      &:hover {
        background: #5568d3;
      }
    }

    .empty-state {
      text-align: center;
      color: white;
      padding: 40px;
      font-size: 1.2em;
    }
  `]
})
export class FaqPublicComponent implements OnInit {
  categorias: Categoria[] = [];
  loading = true;

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error:', error);
        this.loading = false;
      }
    });
  }

  getNombre(categoria: Categoria): string {
    return (categoria as any).nombre || categoria.MODULOS || categoria.Modulos || 'Sin nombre';
  }

  getDescripcion(categoria: Categoria): string {
    return (categoria as any).descripcion || categoria.Descripcion || categoria.DESCRIPCION || 'Sin descripción';
  }
}
