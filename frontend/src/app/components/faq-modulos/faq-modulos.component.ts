import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-faq-modulos',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent],
  template: `
    <div class="faq-modulos-container">
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

      <header class="faq-breadcrumb">
        <a [routerLink]="['/faq']" class="btn-back">← Volver</a>
      </header>

      <main class="faq-main">
        <div class="modules-grid" *ngIf="!loading && modulos.length > 0">
          <div class="module-card" *ngFor="let modulo of modulos">
            <h3>{{ getNombre(modulo) }}</h3>
            <p>{{ getDescripcion(modulo) }}</p>
            <button 
              (click)="irAModulo(modulo.id)" 
              [routerLink]="tieneSubmodulos(modulo.id) ? ['/faq/modulos', modulo.id] : ['/faq/preguntas', modulo.id]"
              class="btn-primary">
              {{ tieneSubmodulos(modulo.id) ? 'Explorar' : 'Ver preguntas' }}
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="!loading && modulos.length === 0">
          <p>No hay módulos disponibles</p>
        </div>

        <app-loading *ngIf="loading"></app-loading>
      </main>
    </div>
  `,
  styles: [`
    .faq-modulos-container {
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

    .faq-breadcrumb {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;

      .btn-back {
        display: inline-block;
        color: white;
        text-decoration: none;
        padding: 8px 15px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }

    .faq-main {
      padding: 40px 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .module-card {
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
      border: none;
      border-radius: 4px;
      cursor: pointer;
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
export class FaqModulosComponent implements OnInit {
  modulos: any[] = [];
  modulosConHijos = new Map<number, boolean>();
  loading = true;
  categoriaId: number = 0;

  constructor(
    private categoriaService: CategoriaService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.categoriaId = Number(params['id']) || 0;
      this.cargarModulos();
    });
  }

  cargarModulos() {
    if (this.categoriaId === 0) return;

    this.categoriaService.getModulosPorCategoria(this.categoriaId).subscribe({
      next: (data) => {
        this.modulos = data;
        this.verificarModulosConHijos();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar módulos:', error);
        this.loading = false;
      }
    });
  }

  verificarModulosConHijos() {
    this.categoriaService.getModulos().subscribe({
      next: (todosLosModulos) => {
        this.modulos.forEach(modulo => {
          const tieneHijos = todosLosModulos.some(m => {
            const idpadre = m.idpadre || m["IDPADRE"];
            return idpadre === modulo.id;
          });
          this.modulosConHijos.set(modulo.id, tieneHijos);
        });
      }
    });
  }

  tieneSubmodulos(moduloId: number): boolean {
    return this.modulosConHijos.get(moduloId) || false;
  }

  irAModulo(moduloId: number) {
    // La navegación se maneja con routerLink
  }

  getNombre(modulo: any): string {
    return modulo.nombre || modulo.MODULOS || modulo.Modulos || 'Sin nombre';
  }

  getDescripcion(modulo: any): string {
    return modulo.descripcion || modulo.Descripcion || modulo.DESCRIPCION || '';
  }
}
