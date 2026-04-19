import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CategoriaService } from '../../services/categoria.service';
import { PreguntaService } from '../../services/pregunta.service';
import { AuthService } from '../../services/auth.service';
import { MetricasService } from '../../services/metricas.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, RouterModule, DecimalPipe],
  template: `
    <div class="dashboard">
      <div class="dashboard-grid">

        <!-- ═══ COL IZQUIERDA: Top Preguntas ═══ -->
        <div class="col-left">
          <div class="card top-card">
            <div class="card-hd">
              <h3 class="card-title">Top Preguntas</h3>
              <a [routerLink]="['/admin/preguntas']" class="view-all">Ver todas</a>
            </div>

            <div *ngIf="!metricas" class="loading-row">Cargando datos...</div>

            <ng-container *ngIf="metricas">
              <p class="section-subtitle">👍 Más útiles</p>
              <div *ngIf="metricas.top_util?.length === 0" class="sin-datos">Sin datos aún</div>
              <div class="top-item" *ngFor="let p of metricas.top_util?.slice(0,5); let i = index">
                <div class="rank-circle rank-purple">{{ i + 1 }}</div>
                <div class="item-info">
                  <p class="item-name" [title]="p.pregunta">{{ p.pregunta }}</p>
                </div>
                <span class="badge badge-util">{{ p.total }}</span>
              </div>

              <div class="card-divider"></div>

              <p class="section-subtitle">👎 Necesitan mejora</p>
              <div *ngIf="metricas.top_no_util?.length === 0" class="sin-datos">Sin datos aún</div>
              <div class="top-item" *ngFor="let p of metricas.top_no_util?.slice(0,3); let i = index">
                <div class="rank-circle rank-coral">{{ i + 1 }}</div>
                <div class="item-info">
                  <p class="item-name" [title]="p.pregunta">{{ p.pregunta }}</p>
                </div>
                <span class="badge badge-no-util">{{ p.total }}</span>
              </div>
            </ng-container>

            <div class="card-divider"></div>
            <p class="section-subtitle">⚡ Acciones rápidas</p>
            <div class="quick-actions">
              <a *ngIf="isAdmin" [routerLink]="['/admin/categorias']" class="qa-btn qa-purple">
                <span>📁</span> Nueva Categoría
              </a>
              <a *ngIf="isAdmin" [routerLink]="['/admin/modulos']" class="qa-btn qa-teal">
                <span>📦</span> Nuevo Módulo
              </a>
              <a [routerLink]="['/admin/preguntas']" class="qa-btn qa-coral">
                <span>❓</span> Nueva Pregunta
              </a>
            </div>
          </div>
        </div>

        <!-- ═══ COL CENTRAL ═══ -->
        <div class="col-center">

          <!-- Estado del Sistema -->
          <div class="card status-card">
            <div class="sc-body">
              <div class="sc-info">
                <p class="sc-label">Estado del Sistema</p>
                <p class="sc-level">Activo</p>
                <div class="sc-row">
                  <span class="sc-key">Votos útiles</span>
                  <span class="sc-val">{{ metricas?.votos_util ?? '—' }}</span>
                </div>
                <div class="sc-row">
                  <span class="sc-key">Total votos</span>
                  <span class="sc-val">{{ metricas?.total_votos ?? '—' }}</span>
                </div>
              </div>
              <div class="donut-container">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="52" fill="none" stroke="#F0EDFF" stroke-width="14"/>
                  <circle cx="65" cy="65" r="52" fill="none" stroke="#6C5ECF" stroke-width="14"
                    [attr.stroke-dasharray]="circ1 | number:'1.0-2'"
                    [attr.stroke-dashoffset]="dashOffset1 | number:'1.0-2'"
                    stroke-linecap="round"
                    transform="rotate(-90 65 65)"/>
                  <circle cx="65" cy="65" r="38" fill="none" stroke="#4CC9F0" stroke-width="8"
                    [attr.stroke-dasharray]="circ0 | number:'1.0-2'"
                    [attr.stroke-dashoffset]="dashOffset0 | number:'1.0-2'"
                    stroke-linecap="round"
                    transform="rotate(-90 65 65)"
                    opacity="0.7"/>
                </svg>
                <div class="donut-text">{{ favPct | number:'1.0-0' }}%</div>
              </div>
            </div>
            <button class="sc-banner" (click)="exportarCsv()">
              <span>🚀</span> Exportar datos completos en CSV
            </button>
          </div>

          <!-- KPI Row -->
          <div class="kpi-row">
            <div class="kpi-card kpi-purple" [routerLink]="['/admin/categorias']" style="cursor:pointer">
              <p class="kpi-label">Categorías</p>
              <p class="kpi-value">{{ totalCategorias }}</p>
              <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="barPct(totalCategorias)"></div></div>
            </div>
            <div class="kpi-card kpi-teal" [routerLink]="['/admin/modulos']" style="cursor:pointer">
              <p class="kpi-label">Módulos</p>
              <p class="kpi-value">{{ totalModulos }}</p>
              <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="barPct(totalModulos)"></div></div>
            </div>
            <div class="kpi-card kpi-coral" [routerLink]="['/admin/preguntas']" style="cursor:pointer">
              <p class="kpi-label">Preguntas</p>
              <p class="kpi-value">{{ totalPreguntas }}</p>
              <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="barPct(totalPreguntas)"></div></div>
            </div>
            <div class="kpi-card kpi-orange">
              <p class="kpi-label">Tickets</p>
              <p class="kpi-value">{{ metricas?.tickets ?? '—' }}</p>
              <div class="kpi-bar"><div class="kpi-fill" [style.width.%]="barPct(metricas?.tickets ?? 0)"></div></div>
            </div>
          </div>

          <!-- Gráfica de barras -->
          <div class="card chart-card">
            <div class="chart-hd">
              <div>
                <h3 class="card-title">Distribución del Contenido</h3>
                <p class="chart-sub">Total de ítems registrados en el sistema</p>
              </div>
              <button class="export-btn" (click)="exportarCsv()">📥 CSV</button>
            </div>
            <div class="bar-chart-area">
              <div class="bar-col">
                <span class="bar-num">{{ totalCategorias }}</span>
                <div class="bar bar-purple" [style.height.px]="barValues.categorias"></div>
                <span class="bar-lbl">01</span>
              </div>
              <div class="bar-col">
                <span class="bar-num">{{ totalModulos }}</span>
                <div class="bar bar-teal" [style.height.px]="barValues.modulos"></div>
                <span class="bar-lbl">02</span>
              </div>
              <div class="bar-col">
                <span class="bar-num">{{ totalPreguntas }}</span>
                <div class="bar bar-coral" [style.height.px]="barValues.preguntas"></div>
                <span class="bar-lbl">03</span>
              </div>
              <div class="bar-col">
                <span class="bar-num">{{ metricas?.tickets ?? 0 }}</span>
                <div class="bar bar-orange" [style.height.px]="barValues.tickets"></div>
                <span class="bar-lbl">04</span>
              </div>
              <div class="bar-col" *ngFor="let h of decorBars">
                <span class="bar-num"></span>
                <div class="bar bar-purple" [style.height.px]="h"></div>
                <span class="bar-lbl">--</span>
              </div>
            </div>
            <div class="chart-summary">
              <div class="summary-item">
                <span class="sum-dot dot-purple"></span>
                <span class="sum-label">Categorías</span>
                <span class="sum-val">{{ totalCategorias }}</span>
              </div>
              <div class="summary-item">
                <span class="sum-dot dot-teal"></span>
                <span class="sum-label">Módulos</span>
                <span class="sum-val">{{ totalModulos }}</span>
              </div>
              <div class="summary-item">
                <span class="sum-dot dot-coral"></span>
                <span class="sum-label">Preguntas</span>
                <span class="sum-val">{{ totalPreguntas }}</span>
              </div>
              <div class="summary-item">
                <span class="sum-dot dot-orange"></span>
                <span class="sum-label">Tickets</span>
                <span class="sum-val">{{ metricas?.tickets ?? 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Mini Stats -->
          <div class="mini-row">
            <div class="mini-card">
              <div class="mini-icon bg-teal">👍</div>
              <div class="mini-info">
                <p class="mini-label">Votos Útiles</p>
                <p class="mini-val">{{ metricas?.votos_util ?? 0 }}</p>
              </div>
              <span class="mini-trend trend-up">▲ {{ utilPct | number:'1.0-0' }}%</span>
            </div>
            <div class="mini-card">
              <div class="mini-icon bg-purple">⭐</div>
              <div class="mini-info">
                <p class="mini-label">Favorabilidad</p>
                <p class="mini-val">{{ favPct | number:'1.0-0' }}%</p>
              </div>
              <span class="mini-trend" [class.trend-up]="favPct >= 50" [class.trend-down]="favPct < 50">
                {{ favPct >= 50 ? '▲' : '▼' }} {{ favPct | number:'1.0-0' }}%
              </span>
            </div>
            <div class="mini-card">
              <div class="mini-icon bg-orange">📊</div>
              <div class="mini-info">
                <p class="mini-label">Total Ítems</p>
                <p class="mini-val">{{ totalCategorias + totalModulos + totalPreguntas }}</p>
              </div>
              <span class="mini-trend trend-up">▲ +{{ metricas?.total_votos ?? 0 }}</span>
            </div>
          </div>

        </div>

        <!-- ═══ COL DERECHA ═══ -->
        <div class="col-right">

          <!-- Perfil -->
          <div class="card profile-card">
            <div class="profile-avatar">{{ userInitial }}</div>
            <h3 class="profile-name">{{ userName }}</h3>
            <p class="profile-role">{{ userRole }}</p>
            <div class="profile-stats">
              <div class="ps-item">
                <p class="ps-val">{{ totalCategorias }}</p>
                <p class="ps-lbl">Categorías</p>
              </div>
              <div class="ps-item">
                <p class="ps-val">{{ totalModulos }}</p>
                <p class="ps-lbl">Módulos</p>
              </div>
              <div class="ps-item">
                <p class="ps-val">{{ totalPreguntas }}</p>
                <p class="ps-lbl">Preguntas</p>
              </div>
            </div>
          </div>

          <!-- Métricas oscuras -->
          <div class="dark-card">
            <div class="dark-hd">
              <span class="dark-title">Métricas de Votos</span>
              <span class="dark-menu">•••</span>
            </div>
            <div class="dark-donut-wrap">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="14"/>
                <circle cx="60" cy="60" r="46" fill="none" stroke="#F07B7B" stroke-width="14"
                  [attr.stroke-dasharray]="circ2 | number:'1.0-2'"
                  [attr.stroke-dashoffset]="dashOffset2 | number:'1.0-2'"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)"/>
                <circle cx="60" cy="60" r="46" fill="none" stroke="#4CC9F0" stroke-width="6"
                  [attr.stroke-dasharray]="circ2 | number:'1.0-2'"
                  [attr.stroke-dashoffset]="noUtilDashOffset | number:'1.0-2'"
                  stroke-linecap="round"
                  [attr.transform]="'rotate(' + (utilDeg - 90) + ' 60 60)'"
                  opacity="0.85"/>
              </svg>
              <div class="dark-donut-icon">🎯</div>
            </div>
            <div class="dark-pct-row">
              <span class="dark-pct">{{ utilPct | number:'1.0-0' }}%</span>
              <span class="dark-pct">{{ noUtilPct | number:'1.0-0' }}%</span>
            </div>
            <div class="dark-metric-row">
              <div class="dark-dot dot-coral"></div>
              <span class="dark-metric-lbl">Votos útiles</span>
            </div>
            <p class="dark-metric-val">
              {{ metricas?.votos_util ?? 0 }}
              <span class="dark-trend">▲ {{ utilPct | number:'1.0-0' }}%</span>
            </p>
            <div class="dark-metric-row">
              <div class="dark-dot dot-teal"></div>
              <span class="dark-metric-lbl">No útiles</span>
            </div>
            <p class="dark-metric-val">
              {{ metricas?.votos_no_util ?? 0 }}
              <span class="dark-trend dark-trend-red">▲ {{ noUtilPct | number:'1.0-0' }}%</span>
            </p>
            <div class="dark-mini-bars">
              <div class="dmb" *ngFor="let h of miniBarHeights" [style.height.px]="h"></div>
            </div>
            <button class="need-ideas-btn" (click)="exportarCsv()">
              <strong>Exportar CSV</strong>
              <small>Descarga todos los votos</small>
            </button>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn 0.3s ease-in;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 300px 1fr 280px;
      gap: 24px;
      align-items: start;
    }

    /* Cards base */
    .card { background:#ffffff; border-radius:18px; padding:22px; box-shadow:0 4px 20px rgba(0,0,0,0.05); }
    .card-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .card-title { margin:0; font-size:15px; font-weight:700; color:#1A1A2E; }
    .view-all { font-size:12px; color:#6C5ECF; text-decoration:none; font-weight:500; }
    .view-all:hover { text-decoration:underline; }
    .card-divider { height:1px; background:#F0F0F8; margin:16px 0; }
    .section-subtitle { margin:0 0 10px; font-size:12px; font-weight:600; color:#B0B5C9; text-transform:uppercase; letter-spacing:0.5px; }
    .sin-datos { font-size:13px; color:#B0B5C9; font-style:italic; padding:6px 0; }
    .loading-row { color:#B0B5C9; font-size:13px; padding:20px 0; text-align:center; }

    /* Top Preguntas */
    .top-card { height:fit-content; }
    .top-item { display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #F5F5FA; }
    .top-item:last-of-type { border-bottom:none; }
    .rank-circle { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:white; flex-shrink:0; }
    .rank-purple { background:#6C5ECF; }
    .rank-coral  { background:#F07B7B; }
    .item-info { flex:1; min-width:0; }
    .item-name { margin:0; font-size:13px; color:#3D3D5C; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .badge { border-radius:20px; padding:2px 10px; font-size:12px; font-weight:600; flex-shrink:0; }
    .badge-util    { background:#E8F5E9; color:#388E3C; }
    .badge-no-util { background:#FFEBEE; color:#C62828; }

    /* Quick Actions */
    .quick-actions { display:flex; flex-direction:column; gap:8px; }
    .qa-btn { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:10px; text-decoration:none; font-size:13px; font-weight:500; transition:opacity 0.2s; }
    .qa-btn:hover { opacity:0.85; }
    .qa-purple { background:#F0EDFF; color:#6C5ECF; }
    .qa-teal   { background:#E0F7FA; color:#0097A7; }
    .qa-coral  { background:#FFEBEE; color:#E05A5A; }

    /* Status Card */
    .status-card { padding:0; overflow:hidden; }
    .sc-body { display:flex; align-items:center; justify-content:space-between; padding:24px 24px 20px; }
    .sc-label { margin:0 0 4px; font-size:13px; color:#9197A3; font-weight:500; }
    .sc-level { margin:0 0 16px; font-size:18px; font-weight:700; color:#1A1A2E; }
    .sc-row   { display:flex; gap:10px; font-size:13px; margin-bottom:6px; }
    .sc-key   { color:#9197A3; }
    .sc-val   { font-weight:600; color:#1A1A2E; }
    .donut-container { position:relative; width:130px; height:130px; flex-shrink:0; }
    .donut-container svg { display:block; }
    .donut-text { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:18px; font-weight:800; color:#1A1A2E; }
    .sc-banner { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; background:linear-gradient(135deg,#EDE8FF 0%,#E0F7FA 100%); border:none; color:#5A4FCF; font-size:13px; font-weight:600; cursor:pointer; border-top:1px solid #F0EDFF; transition:opacity 0.2s; }
    .sc-banner:hover { opacity:0.8; }

    /* KPI Row */
    .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin:20px 0; }
    .kpi-card { border-radius:16px; padding:16px; transition:transform 0.2s; }
    .kpi-card:hover { transform:translateY(-3px); }
    .kpi-purple { background:#F0EDFF; }
    .kpi-teal   { background:#E0F7FA; }
    .kpi-coral  { background:#FFEBEE; }
    .kpi-orange { background:#FFF3E0; }
    .kpi-label { margin:0 0 6px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#8A8FA8; }
    .kpi-value { margin:0 0 10px; font-size:24px; font-weight:800; color:#1A1A2E; }
    .kpi-bar   { height:4px; background:rgba(0,0,0,.08); border-radius:4px; overflow:hidden; }
    .kpi-fill  { height:100%; border-radius:4px; transition:width 0.6s ease; }
    .kpi-purple .kpi-fill { background:#6C5ECF; }
    .kpi-teal   .kpi-fill { background:#00BCD4; }
    .kpi-coral  .kpi-fill { background:#F07B7B; }
    .kpi-orange .kpi-fill { background:#FF9800; }

    /* Bar Chart */
    .chart-card { margin-bottom:0; }
    .chart-hd { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
    .chart-sub { margin:4px 0 0; font-size:12px; color:#B0B5C9; }
    .export-btn { padding:8px 14px; background:linear-gradient(135deg,#6C5ECF,#9B8AF0); color:white; border:none; border-radius:10px; font-size:12px; font-weight:600; cursor:pointer; transition:opacity 0.2s; white-space:nowrap; }
    .export-btn:hover { opacity:0.9; }
    .bar-chart-area { display:flex; align-items:flex-end; gap:8px; height:150px; }
    .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; }
    .bar-num { font-size:10px; color:#B0B5C9; font-weight:600; min-height:14px; }
    .bar { width:100%; max-width:32px; border-radius:6px 6px 0 0; transition:height 0.5s ease; min-height:4px; }
    .bar-lbl { font-size:10px; color:#B0B5C9; margin-top:4px; }
    .bar-purple { background:linear-gradient(to top,#6C5ECF,#9B8AF0); }
    .bar-teal   { background:linear-gradient(to top,#00ACC1,#4DD0E1); }
    .bar-coral  { background:linear-gradient(to top,#EF5350,#EF9A9A); }
    .bar-orange { background:linear-gradient(to top,#FB8C00,#FFB74D); }
    .chart-summary { display:flex; gap:20px; margin-top:16px; padding-top:14px; border-top:1px solid #F0F0F8; flex-wrap:wrap; }
    .summary-item { display:flex; align-items:center; gap:6px; font-size:12px; }
    .sum-dot    { width:8px; height:8px; border-radius:50%; }
    .dot-purple { background:#6C5ECF; }
    .dot-teal   { background:#00ACC1; }
    .dot-coral  { background:#EF5350; }
    .dot-orange { background:#FB8C00; }
    .sum-label  { color:#8A8FA8; }
    .sum-val    { font-weight:700; color:#1A1A2E; }

    /* Mini Stats */
    .mini-row  { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:20px; }
    .mini-card { background:#ffffff; border-radius:16px; padding:16px; display:flex; align-items:center; gap:12px; box-shadow:0 4px 20px rgba(0,0,0,.05); }
    .mini-icon { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .bg-teal   { background:#E0F7FA; }
    .bg-purple { background:#F0EDFF; }
    .bg-orange { background:#FFF3E0; }
    .mini-info  { flex:1; min-width:0; }
    .mini-label { margin:0; font-size:11px; color:#9197A3; }
    .mini-val   { margin:0; font-size:18px; font-weight:700; color:#1A1A2E; }
    .mini-trend { font-size:11px; font-weight:600; white-space:nowrap; }
    .trend-up   { color:#4CAF50; }
    .trend-down { color:#F07B7B; }

    /* Profile Card */
    .profile-card { text-align:center; }
    .profile-avatar { width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg,#6C5ECF,#9B8AF0); color:white; font-size:24px; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
    .profile-name  { margin:0 0 4px; font-size:16px; font-weight:700; color:#1A1A2E; }
    .profile-role  { margin:0 0 16px; font-size:12px; color:#9197A3; }
    .profile-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
    .ps-item { background:#F5F5FF; border-radius:10px; padding:10px 6px; }
    .ps-val  { margin:0; font-size:16px; font-weight:700; color:#6C5ECF; }
    .ps-lbl  { margin:0; font-size:10px; color:#9197A3; }

    /* Dark Metrics Card */
    .dark-card  { background:linear-gradient(135deg,#6C5ECF,#9B8AF0); border-radius:18px; padding:22px; color:white; margin-top:20px; }
    .dark-hd    { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .dark-title { font-size:14px; font-weight:700; }
    .dark-menu  { color:rgba(255,255,255,.5); font-size:18px; cursor:pointer; }
    .dark-donut-wrap { position:relative; display:flex; justify-content:center; margin-bottom:12px; }
    .dark-donut-wrap svg { display:block; }
    .dark-donut-icon { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:22px; }
    .dark-pct-row { display:flex; justify-content:space-between; margin-bottom:12px; }
    .dark-pct { font-size:16px; font-weight:700; }
    .dark-metric-row { display:flex; align-items:center; gap:6px; margin-bottom:2px; }
    .dark-dot    { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .dot-coral   { background:#F07B7B; }
    .dot-teal    { background:#4CC9F0; }
    .dark-metric-lbl { font-size:12px; color:rgba(255,255,255,.6); }
    .dark-metric-val { margin:0 0 10px; font-size:18px; font-weight:700; display:flex; align-items:center; gap:8px; }
    .dark-trend     { font-size:11px; font-weight:600; color:#4CAF50; }
    .dark-trend-red { color:#F07B7B; }
    .dark-mini-bars { display:flex; align-items:flex-end; gap:3px; height:40px; margin:12px 0; }
    .dmb { flex:1; border-radius:2px 2px 0 0; background:rgba(255,255,255,.2); min-height:4px; }
    .need-ideas-btn { width:100%; padding:12px; background:linear-gradient(135deg,#F07B7B,#E05A5A); border:none; border-radius:12px; color:white; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; transition:opacity 0.2s; }
    .need-ideas-btn:hover { opacity:0.9; }
    .need-ideas-btn strong { font-size:13px; }
    .need-ideas-btn small  { font-size:11px; opacity:0.85; }

    @media (max-width:1200px) { .dashboard-grid { grid-template-columns:260px 1fr 240px; } }
    @media (max-width:960px)  { .dashboard-grid { grid-template-columns:1fr; } .col-right { display:none; } .kpi-row { grid-template-columns:repeat(2,1fr); } }
    @media (max-width:600px)  { .kpi-row { grid-template-columns:repeat(2,1fr); } .mini-row { grid-template-columns:1fr; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  totalCategorias  = 0;
  totalModulos     = 0;
  totalPreguntas   = 0;
  isAdmin          = false;
  allowedModuleIds: number[] = [];
  metricas: any    = null;

  readonly circ0 = 2 * Math.PI * 38;
  readonly circ1 = 2 * Math.PI * 52;
  readonly circ2 = 2 * Math.PI * 46;
  readonly decorBars     = [45, 65, 30, 80, 55, 70, 40, 60, 50];
  readonly miniBarHeights = [10, 20, 15, 30, 25, 40, 35, 30, 20, 15, 25, 30];

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

  get favPct(): number {
    if (!this.metricas?.total_votos) return 0;
    return Math.round((this.metricas.votos_util / this.metricas.total_votos) * 100);
  }
  get utilPct():  number { return this.favPct; }
  get noUtilPct(): number { return 100 - this.favPct; }

  get dashOffset1(): number { return this.circ1 * (1 - this.favPct / 100); }
  get dashOffset0(): number { return this.circ0 * (1 - this.favPct / 100); }
  get utilDeg():    number  { return (this.utilPct / 100) * 360; }
  get dashOffset2(): number { return this.circ2 * (1 - this.utilPct / 100); }
  get noUtilDashOffset(): number { return this.circ2 * (1 - this.noUtilPct / 100); }

  get barValues() {
    const max = Math.max(this.totalCategorias, this.totalModulos, this.totalPreguntas, this.metricas?.tickets ?? 0, 1);
    return {
      categorias: Math.round((this.totalCategorias / max) * 120),
      modulos:    Math.round((this.totalModulos    / max) * 120),
      preguntas:  Math.round((this.totalPreguntas  / max) * 120),
      tickets:    Math.round(((this.metricas?.tickets ?? 0) / max) * 120)
    };
  }

  barPct(val: number): number {
    const max = Math.max(this.totalCategorias, this.totalModulos, this.totalPreguntas, this.metricas?.tickets ?? 0, 1);
    return Math.min((val / max) * 100, 100);
  }

  get userName():    string { return this.authService.getUser()?.name ?? 'Usuario'; }
  get userInitial(): string { return this.userName.charAt(0).toUpperCase(); }
  get userRole():    string { return this.isAdmin ? 'Administrador' : 'Usuario'; }

  cargarMetricas() {
    this.metricasService.getDashboard().subscribe({
      next: (data) => { this.metricas = data; },
      error: () => {}
    });
  }

  exportarCsv() { this.metricasService.downloadCsv(); }

  cargarEstadisticas() {
    this.categoriaService.getModulos().subscribe({
      next: (data) => {
        const norm = data.map(m => ({
          ...m,
          id:      Number((m as any).id),
          idpadre: (m as any).idpadre ? Number((m as any).idpadre) : null
        }));
        if (this.isAdmin) {
          this.totalModulos    = norm.length;
          this.totalCategorias = norm.filter(m => !m.idpadre).length;
        } else {
          const allowed    = new Set(this.allowedModuleIds.map(id => Number(id)));
          const permitidos = norm.filter(m => allowed.has(Number(m.id)));
          this.totalModulos    = permitidos.length;
          this.totalCategorias = permitidos.filter(m => !m.idpadre).length;
        }
      }
    });
    this.preguntaService.getPreguntas().subscribe({
      next: (data) => {
        if (this.isAdmin) { this.totalPreguntas = data.length; return; }
        const allowed = new Set(this.allowedModuleIds.map(id => Number(id)));
        this.totalPreguntas = data.filter(p =>
          allowed.has(Number((p as any).Idmodulo || (p as any).idmodulo || (p as any).id_modulo))
        ).length;
      }
    });
  }
}
