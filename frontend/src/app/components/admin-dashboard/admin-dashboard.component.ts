import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { PreguntaService } from '../../services/pregunta.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <h2>📊 Estadísticas</h2>
      
      <div class="stats-grid">
        <div class="stat-card" [routerLink]="['/admin/categorias']">
          <div class="stat-icon">📁</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalCategorias }}</div>
            <div class="stat-label">Categorías</div>
          </div>
          <div class="stat-arrow">→</div>
        </div>
        
        <div class="stat-card" [routerLink]="['/admin/modulos']">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalModulos }}</div>
            <div class="stat-label">Módulos</div>
          </div>
          <div class="stat-arrow">→</div>
        </div>
        
        <div class="stat-card" [routerLink]="['/admin/preguntas']">
          <div class="stat-icon">❓</div>
          <div class="stat-content">
            <div class="stat-number">{{ totalPreguntas }}</div>
            <div class="stat-label">Preguntas</div>
          </div>
          <div class="stat-arrow">→</div>
        </div>
      </div>

      <div class="quick-actions">
        <h3>⚡ Acciones rápidas</h3>
        <div class="actions-grid">
          <a *ngIf="isAdmin" [routerLink]="['/admin/categorias']" class="action-btn primary">
            <span class="icon">➕</span>
            <span>Nueva Categoría</span>
          </a>
          <a *ngIf="isAdmin" [routerLink]="['/admin/modulos']" class="action-btn secondary">
            <span class="icon">➕</span>
            <span>Nuevo Módulo</span>
          </a>
          <a [routerLink]="['/admin/preguntas']" class="action-btn tertiary">
            <span class="icon">➕</span>
            <span>Nueva Pregunta</span>
          </a>
        </div>
      </div>

      <div class="welcome-section">
        <h3>👋 Bienvenido al Panel de Administración</h3>
        <p>Desde aquí puedes gestionar todas las categorías, módulos y preguntas de tu FAQ.</p>
        <div class="features">
          <div class="feature">
            <span class="feature-icon">✅</span>
            <span>Crea y edita categorías</span>
          </div>
          <div class="feature">
            <span class="feature-icon">✅</span>
            <span>Organiza módulos jerárquicos</span>
          </div>
          <div class="feature">
            <span class="feature-icon">✅</span>
            <span>Mantén una FAQ actualizada</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    h2 {
      color: #333;
      font-size: 28px;
      margin: 0 0 30px 0;
      font-weight: 700;
    }

    h3 {
      color: #555;
      font-size: 18px;
      margin: 30px 0 20px 0;
      font-weight: 600;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      gap: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .stat-icon {
      font-size: 40px;
      min-width: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 32px;
      font-weight: 700;
      color: #667eea;
      line-height: 1;
    }

    .stat-label {
      font-size: 14px;
      color: #999;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stat-arrow {
      font-size: 24px;
      color: #ddd;
      transition: all 0.3s ease;
    }

    .stat-card:hover .stat-arrow {
      color: #667eea;
      transform: translateX(5px);
    }

    /* Quick Actions */
    .quick-actions {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-bottom: 30px;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .action-btn {
      padding: 20px;
      border-radius: 10px;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .action-btn .icon {
      font-size: 32px;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .action-btn.secondary {
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
      color: white;
    }

    .action-btn.tertiary {
      background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
      color: white;
    }

    .action-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    }

    /* Welcome Section */
    .welcome-section {
      background: #383838;
      color: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .welcome-section h3 {
      color: white;
      margin-top: 0;
    }

    .welcome-section p {
      margin: 0 0 20px 0;
      opacity: 0.9;
      line-height: 1.6;
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .feature {
      background: rgba(255, 255, 255, 0.1);
      padding: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }

    .feature-icon {
      font-size: 20px;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      h2 {
        font-size: 22px;
      }

      .stat-card {
        padding: 20px;
      }

      .stat-number {
        font-size: 24px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  totalCategorias = 0;
  totalModulos = 0;
  totalPreguntas = 0;
  isAdmin = false;
  allowedModuleIds: number[] = [];

  constructor(
    private categoriaService: CategoriaService,
    private preguntaService: PreguntaService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.allowedModuleIds = this.authService.getAllowedModuleIds();
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.categoriaService.getModulos().subscribe({
      next: (data) => {
        const normalizados = data.map(m => ({
          ...m,
          id: Number((m as any).id),
          idpadre: (m as any).idpadre ? Number((m as any).idpadre) : null
        }));

        if (this.isAdmin) {
          this.totalModulos = normalizados.length;
          this.totalCategorias = normalizados.filter(m => !m.idpadre).length;
        } else {
          const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
          const permitidos = normalizados.filter(m => allowed.has(Number(m.id)));
          this.totalModulos = permitidos.length;
          this.totalCategorias = permitidos.filter(m => !m.idpadre).length;
        }
      }
    });

    this.preguntaService.getPreguntas().subscribe({
      next: (data) => {
        if (this.isAdmin) {
          this.totalPreguntas = data.length;
          return;
        }

        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        this.totalPreguntas = data.filter(p => allowed.has(Number((p as any).Idmodulo || (p as any).idmodulo || (p as any).id_modulo))).length;
      }
    });
  }
}
