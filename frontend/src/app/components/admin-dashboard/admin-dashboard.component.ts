import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { PreguntaService } from '../../services/pregunta.service';
import { AuthService } from '../../services/auth.service';
import { MetricasService } from '../../services/metricas.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <h2>📊 Estadísticas</h2>

      <!-- ===== Tarjetas de contenido ===== -->
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

        <div class="stat-card stat-tickets" [routerLink]="['/admin/tickets']">
          <div class="stat-icon">🎫</div>
          <div class="stat-content">
            <div class="stat-number">{{ metricas?.tickets ?? '...' }}</div>
            <div class="stat-label">Tickets enviados</div>
          </div>
          <div class="stat-arrow">→</div>
        </div>
      </div>

      <!-- ===== Métricas de votos ===== -->
      <div class="metricas-section" *ngIf="metricas">
        <div class="metricas-header">
          <h3>👍 Métricas de utilidad</h3>
          <button class="export-btn" (click)="exportarCsv()">
            📥 Exportar CSV
          </button>
        </div>

        <div class="metricas-grid">
          <!-- Favorabilidad -->
          <div class="metrica-card favorabilidad">
            <div class="metrica-titulo">Favorabilidad global</div>
            <div class="metrica-valor" [class.alta]="metricas.favorabilidad >= 70" [class.media]="metricas.favorabilidad >= 40 && metricas.favorabilidad < 70" [class.baja]="metricas.favorabilidad < 40">
              {{ metricas.favorabilidad | number:'1.0-0' }}%
            </div>
            <div class="barra-fav">
              <div class="barra-fill" [style.width.%]="metricas.favorabilidad"
                [class.alta]="metricas.favorabilidad >= 70"
                [class.media]="metricas.favorabilidad >= 40 && metricas.favorabilidad < 70"
                [class.baja]="metricas.favorabilidad < 40">
              </div>
            </div>
            <div class="metrica-sub">Total votos: {{ metricas.total_votos }}</div>
          </div>

          <!-- Votos útil -->
          <div class="metrica-card util">
            <div class="metrica-titulo">👍 Votos útil</div>
            <div class="metrica-valor verde">{{ metricas.votos_util }}</div>
            <div class="metrica-sub">respuestas marcadas como útiles</div>
          </div>

          <!-- Votos no útil -->
          <div class="metrica-card no-util">
            <div class="metrica-titulo">👎 No útil</div>
            <div class="metrica-valor rojo">{{ metricas.votos_no_util }}</div>
            <div class="metrica-sub">respuestas que necesitan mejora</div>
          </div>
        </div>

        <!-- Top preguntas útiles / no útiles -->
        <div class="top-grid">
          <div class="top-card">
            <h4>🏆 Top preguntas más útiles</h4>
            <div *ngIf="metricas.top_util?.length === 0" class="sin-datos">Sin datos aún</div>
            <div class="top-item" *ngFor="let p of metricas.top_util; let i = index">
              <span class="top-rank">{{ i + 1 }}</span>
              <span class="top-nombre">{{ p.pregunta }}</span>
              <span class="top-badge util">?? {{ p.total }}</span>
            </div>
          </div>

          <div class="top-card">
            <h4>⚠️ Top preguntas con más "no útil"</h4>
            <div *ngIf="metricas.top_no_util?.length === 0" class="sin-datos">Sin datos aún</div>
            <div class="top-item" *ngFor="let p of metricas.top_no_util; let i = index">
              <span class="top-rank">{{ i + 1 }}</span>
              <span class="top-nombre">{{ p.pregunta }}</span>
              <span class="top-badge no-util">?? {{ p.total }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Acciones rápidas ===== -->
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
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
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

    .stat-card.stat-tickets {
      border-left: 4px solid #ff9800;
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

    /* ===== Métricas de votos ===== */
    .metricas-section {
      background: white;
      padding: 28px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-bottom: 30px;
    }

    .metricas-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .metricas-header h3 {
      margin: 0;
    }

    .export-btn {
      padding: 9px 20px;
      background: linear-gradient(135deg, #4CAF50, #388E3C);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.35);
    }

    .metricas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metrica-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 20px;
      border-left: 4px solid #dee2e6;
    }

    .metrica-card.favorabilidad { border-left-color: #667eea; }
    .metrica-card.util          { border-left-color: #4caf50; }
    .metrica-card.no-util       { border-left-color: #ef5350; }

    .metrica-titulo {
      font-size: 13px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .metrica-valor {
      font-size: 36px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;
      color: #333;
    }

    .metrica-valor.verde { color: #4caf50; }
    .metrica-valor.rojo  { color: #ef5350; }
    .metrica-valor.alta  { color: #4caf50; }
    .metrica-valor.media { color: #ff9800; }
    .metrica-valor.baja  { color: #ef5350; }

    .metrica-sub {
      font-size: 12px;
      color: #999;
    }

    /* Barra de favorabilidad */
    .barra-fav {
      width: 100%;
      height: 6px;
      background: #dee2e6;
      border-radius: 3px;
      margin-bottom: 8px;
      overflow: hidden;
    }

    .barra-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s ease;
      background: #dee2e6;
    }

    .barra-fill.alta  { background: #4caf50; }
    .barra-fill.media { background: #ff9800; }
    .barra-fill.baja  { background: #ef5350; }

    /* Top preguntas */
    .top-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .top-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 18px;
    }

    .top-card h4 {
      margin: 0 0 14px 0;
      font-size: 14px;
      color: #495057;
      font-weight: 600;
    }

    .sin-datos {
      color: #adb5bd;
      font-size: 13px;
      font-style: italic;
      padding: 8px 0;
    }

    .top-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
      font-size: 13px;
    }

    .top-item:last-child {
      border-bottom: none;
    }

    .top-rank {
      width: 22px;
      height: 22px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .top-nombre {
      flex: 1;
      color: #495057;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .top-badge {
      border-radius: 12px;
      padding: 2px 9px;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .top-badge.util    { background: #e8f5e9; color: #388e3c; }
    .top-badge.no-util { background: #ffebee; color: #c62828; }

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
        grid-template-columns: repeat(2, 1fr);
      }

      h2 {
        font-size: 22px;
      }

      .stat-card {
        padding: 16px;
      }

      .stat-number {
        font-size: 24px;
      }

      .top-grid {
        grid-template-columns: 1fr;
      }

      .metricas-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
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
  metricas: any = null;

  constructor(
    private categoriaService: CategoriaService,
    private preguntaService: PreguntaService,
    private authService: AuthService,
    private metricasService: MetricasService
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.allowedModuleIds = this.authService.getAllowedModuleIds();
    this.cargarEstadisticas();
    this.cargarMetricas();
  }

  cargarMetricas() {
    this.metricasService.getDashboard().subscribe({
      next: (data) => { this.metricas = data; },
      error: () => { /* sin m�tricas a�n */ }
    });
  }

  exportarCsv() {
    this.metricasService.downloadCsv();
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
