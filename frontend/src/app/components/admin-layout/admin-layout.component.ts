import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { SearchService, SearchResults } from '../../services/search.service';
import { NotificacionService, Notificacion } from '../../services/notificacion.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="admin-wrapper">

      <!-- ═══ SIDEBAR ═══ -->
      <aside class="sidebar" *ngIf="isPrivileged">
        <div class="sidebar-brand">
          <div class="brand-logo">FA</div>
          <span class="brand-name">FAQ Admin</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-label">Inicio</span>
          </a>
          <a *ngIf="isAdmin" routerLink="/admin/categorias" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📁</span>
            <span class="nav-label">Categorías</span>
          </a>
          <a routerLink="/admin/modulos" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span>
            <span class="nav-label">Módulos</span>
          </a>
          <a routerLink="/admin/preguntas" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">❓</span>
            <span class="nav-label">Preguntas</span>
          </a>
          <a routerLink="/admin/config-formularios" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">Config. Formularios</span>
          </a>
          <a routerLink="/admin/config-formularios-pregunta" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🎯</span>
            <span class="nav-label">Forms. por Pregunta</span>
          </a>
          <a routerLink="/admin/solicitud-accesos" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔑</span>
            <span class="nav-label">Solicitud Accesos</span>
          </a>
          <a *ngIf="isAdmin" routerLink="/admin/usuarios" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span>
            <span class="nav-label">Usuarios</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <!-- ═══ MAIN AREA ═══ -->
      <div class="main-area" [class.full-width]="!isPrivileged">

        <!-- Top Header -->
        <header class="top-header" *ngIf="isPrivileged">
          <div class="header-left">
            <h1 class="page-title">Panel de Administración</h1>
            <p class="page-subtitle">Bienvenido de vuelta, {{ userName }}.</p>
          </div>
          <div class="header-center">
            <div class="search-bar" (click)="$event.stopPropagation()">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar en el panel..."
                [(ngModel)]="searchQuery"
                (input)="onSearchInput()"
                (focus)="onSearchFocus()"
                autocomplete="off"
              />
              <!-- Dropdown resultados -->
              <div class="search-dropdown" *ngIf="showSearchDropdown">
                <div *ngIf="searchLoading" class="search-loading">Buscando...</div>
                <ng-container *ngIf="!searchLoading">
                  <!-- Sin resultados -->
                  <div *ngIf="searchEmpty" class="search-empty">
                    Sin resultados para "{{ searchQuery }}"
                  </div>
                  <!-- Módulos -->
                  <div *ngIf="searchResults.modulos.length > 0" class="search-group">
                    <div class="search-group-label">📦 Módulos</div>
                    <div
                      class="search-result-item"
                      *ngFor="let item of searchResults.modulos"
                      (click)="goToResult('modulos', item)"
                    >
                      <span class="result-title">{{ item.nombre }}</span>
                      <span class="result-desc" *ngIf="item.descripcion">{{ item.descripcion }}</span>
                    </div>
                  </div>
                  <!-- Preguntas -->
                  <div *ngIf="searchResults.preguntas.length > 0" class="search-group">
                    <div class="search-group-label">❓ Preguntas</div>
                    <div
                      class="search-result-item"
                      *ngFor="let item of searchResults.preguntas"
                      (click)="goToResult('preguntas', item)"
                    >
                      <span class="result-title">{{ item.titulo }}</span>
                      <span class="result-badge" *ngIf="item.modulo_nombre">{{ item.modulo_nombre }}</span>
                    </div>
                  </div>
                  <!-- Categorías -->
                  <div *ngIf="searchResults.categorias.length > 0" class="search-group">
                    <div class="search-group-label">📁 Categorías</div>
                    <div
                      class="search-result-item"
                      *ngFor="let item of searchResults.categorias"
                      (click)="goToResult('categorias', item)"
                    >
                      <span class="result-title">{{ item.nombre }}</span>
                    </div>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="notif-wrapper" (click)="$event.stopPropagation()">
              <button class="icon-btn notif-btn" aria-label="Notificaciones" (click)="toggleNotifDropdown()">
                🔔
                <span class="notif-badge" *ngIf="totalNoLeidas > 0">{{ totalNoLeidas > 99 ? '99+' : totalNoLeidas }}</span>
              </button>
              <!-- Dropdown notificaciones -->
              <div class="notif-dropdown" *ngIf="showNotifDropdown">
                <div class="notif-header">
                  <span class="notif-title">Notificaciones</span>
                  <button class="mark-all-btn" (click)="marcarTodasLeidas()" *ngIf="totalNoLeidas > 0">
                    Marcar todo leído
                  </button>
                </div>
                <div class="notif-list">
                  <div *ngIf="notificaciones.length === 0" class="notif-empty">
                    <span>🔕</span>
                    <p>Sin notificaciones</p>
                  </div>
                  <div
                    class="notif-item"
                    *ngFor="let n of notificaciones"
                    [class.unread]="!n.leida"
                    (click)="marcarLeida(n)"
                  >
                    <span class="notif-emoji">{{ n.tipo === 'voto_util' ? '👍' : '👎' }}</span>
                    <div class="notif-body">
                      <p class="notif-msg">{{ n.mensaje }}</p>
                      <span class="notif-time">{{ timeAgo(n.created_at) }}</span>
                    </div>
                    <span class="unread-dot" *ngIf="!n.leida"></span>
                  </div>
                </div>
              </div>
            </div>
            <div class="avatar-chip" [title]="userName">{{ userInitial }}</div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .admin-wrapper {
      display: flex;
      height: 100vh;
      background: #F0F2FB;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ═══════════ SIDEBAR ═══════════ */
    .sidebar {
      width: 240px;
      min-width: 240px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 16px rgba(108, 94, 207, 0.08);
      z-index: 100;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 28px 22px 22px;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6C5ECF 0%, #9B8AF0 100%);
      color: white;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 18px;
      font-weight: 700;
      color: #1A1A2E;
    }

    .sidebar-nav {
      flex: 1;
      padding: 6px 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      color: #8A8FA8;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.18s ease;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background: #F8F7FF;
      color: #6C5ECF;
    }

    .nav-item.active {
      background: #F0EDFF;
      color: #6C5ECF;
      font-weight: 600;
      border-left-color: #6C5ECF;
    }

    .nav-icon {
      font-size: 18px;
      min-width: 24px;
      text-align: center;
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sidebar-footer {
      padding: 14px 14px 24px;
      border-top: 1px solid #F0F0F8;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      border: none;
      background: none;
      color: #E05A5A;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.18s;
    }

    .logout-btn:hover {
      background: #FFF0F0;
    }

    /* ═══════════ MAIN AREA ═══════════ */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    .main-area.full-width {
      width: 100%;
    }

    /* ═══════════ TOP HEADER ═══════════ */
    .top-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px 32px;
      background: #ffffff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      flex-shrink: 0;
    }

    .header-left {
      flex-shrink: 0;
    }

    .page-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #1A1A2E;
      line-height: 1.2;
    }

    .page-subtitle {
      margin: 3px 0 0;
      font-size: 13px;
      color: #9197A3;
    }

    .header-center {
      flex: 1;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F4F5F9;
      border-radius: 14px;
      padding: 10px 18px;
      max-width: 360px;
      margin: 0 auto;
      position: relative;
    }

    .search-icon {
      font-size: 14px;
      opacity: 0.5;
      flex-shrink: 0;
    }

    .search-bar input {
      border: none;
      background: none;
      outline: none;
      font-size: 14px;
      color: #555;
      width: 100%;
    }

    /* ── Search Dropdown ── */
    .search-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: white;
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      z-index: 1000;
      max-height: 380px;
      overflow-y: auto;
      border: 1px solid #EAEBF2;
    }

    .search-loading,
    .search-empty {
      padding: 20px;
      text-align: center;
      color: #9197A3;
      font-size: 13px;
    }

    .search-group {
      padding: 8px 0;
      border-bottom: 1px solid #F0F0F8;

      &:last-child { border-bottom: none; }
    }

    .search-group-label {
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9197A3;
    }

    .search-result-item {
      padding: 10px 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;

      &:hover { background: #F7F6FF; }

      .result-title {
        font-size: 13px;
        font-weight: 500;
        color: #1A1A2E;
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .result-desc {
        font-size: 12px;
        color: #9197A3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
      }

      .result-badge {
        background: #F0EDFF;
        color: #6C5ECF;
        padding: 2px 8px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 1.5px solid #EAEBF2;
      background: white;
      font-size: 17px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.18s;
      position: relative;
    }

    .icon-btn:hover {
      background: #F4F5F9;
    }

    /* ── Notificaciones ── */
    .notif-wrapper {
      position: relative;
    }

    .notif-btn {
      position: relative;
    }

    .notif-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #EF5350;
      color: white;
      font-size: 10px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      line-height: 1;
      border: 2px solid white;
    }

    .notif-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 340px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
      z-index: 1000;
      border: 1px solid #EAEBF2;
      overflow: hidden;
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px 12px;
      border-bottom: 1px solid #F0F0F8;
    }

    .notif-title {
      font-size: 15px;
      font-weight: 700;
      color: #1A1A2E;
    }

    .mark-all-btn {
      border: none;
      background: none;
      color: #6C5ECF;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 8px;
      transition: background 0.15s;

      &:hover { background: #F0EDFF; }
    }

    .notif-list {
      max-height: 360px;
      overflow-y: auto;
    }

    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 20px;
      color: #9197A3;

      span { font-size: 28px; }
      p { margin: 0; font-size: 13px; }
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid #F7F7FB;
      cursor: pointer;
      transition: background 0.15s;
      position: relative;

      &:last-child { border-bottom: none; }

      &:hover { background: #FAFAFE; }

      &.unread { background: #FAFBFF; }

      .notif-emoji {
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 1px;
      }

      .notif-body {
        flex: 1;
        min-width: 0;

        .notif-msg {
          margin: 0 0 4px 0;
          font-size: 13px;
          color: #3D3D5C;
          line-height: 1.4;
          word-break: break-word;
        }

        .notif-time {
          font-size: 11px;
          color: #B0B5C9;
          font-weight: 500;
        }
      }

      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6C5ECF;
        flex-shrink: 0;
        margin-top: 5px;
      }
    }

    .avatar-chip {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6C5ECF, #9B8AF0);
      color: white;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    /* ═══════════ PAGE CONTENT ═══════════ */
    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 28px 32px;
    }

    /* ═══════════ RESPONSIVE ═══════════ */
    @media (max-width: 1024px) {
      .sidebar {
        width: 200px;
        min-width: 200px;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
      .top-header {
        padding: 14px 20px;
      }
      .header-center {
        display: none;
      }
      .page-content {
        padding: 20px;
      }
    }
  `]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isAdmin = false;
  isEditor = false;
  isPrivileged = false;
  userName = 'Usuario';
  userInitial = 'U';

  // ── Búsqueda ──────────────────────────────────────────────────
  searchQuery = '';
  showSearchDropdown = false;
  searchLoading = false;
  searchEmpty = false;
  searchResults: SearchResults = { modulos: [], preguntas: [], categorias: [] };

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  // ── Notificaciones ────────────────────────────────────────────
  notificaciones: Notificacion[] = [];
  totalNoLeidas = 0;
  showNotifDropdown = false;

  private notifSub?: Subscription;
  private notifTotalSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private searchService: SearchService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.isAdmin = this.authService.isAdmin();
    this.isEditor = !this.isAdmin && this.authService.hasModulePermissions();
    this.isPrivileged = this.isAdmin || this.isEditor;

    if (user) {
      this.userName = user.name;
      this.userInitial = user.name.charAt(0).toUpperCase();
    }

    if (!this.isPrivileged) {
      this.router.navigate(['/preguntas']);
      return;
    }

    // Búsqueda con debounce
    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) {
          this.searchResults = { modulos: [], preguntas: [], categorias: [] };
          this.searchLoading = false;
          this.searchEmpty = false;
          return [];
        }
        this.searchLoading = true;
        return this.searchService.search(q);
      })
    ).subscribe({
      next: (res: any) => {
        this.searchLoading = false;
        this.searchResults = res;
        this.searchEmpty =
          res.modulos.length === 0 &&
          res.preguntas.length === 0 &&
          res.categorias.length === 0;
      },
      error: () => { this.searchLoading = false; }
    });

    // Notificaciones + polling
    this.notifSub = this.notificacionService.notificaciones$.subscribe(
      n => this.notificaciones = n
    );
    this.notifTotalSub = this.notificacionService.totalNoLeidas$.subscribe(
      t => this.totalNoLeidas = t
    );
    this.notificacionService.startPolling();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.notifTotalSub?.unsubscribe();
    this.notificacionService.stopPolling();
  }

  // ── Búsqueda ──────────────────────────────────────────────────
  onSearchInput(): void {
    const q = this.searchQuery.trim();
    if (q.length >= 2) {
      this.showSearchDropdown = true;
      this.searchLoading = true;
    } else {
      this.showSearchDropdown = false;
      this.searchResults = { modulos: [], preguntas: [], categorias: [] };
      this.searchEmpty = false;
    }
    this.searchSubject.next(q);
  }

  onSearchFocus(): void {
    if (this.searchQuery.trim().length >= 2) {
      this.showSearchDropdown = true;
    }
  }

  goToResult(type: 'modulos' | 'preguntas' | 'categorias', item: any): void {
    this.showSearchDropdown = false;
    this.searchQuery = '';
    this.searchResults = { modulos: [], preguntas: [], categorias: [] };
    this.router.navigate([`/admin/${type}`]);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showSearchDropdown = false;
    this.showNotifDropdown = false;
  }

  // ── Notificaciones ────────────────────────────────────────────
  toggleNotifDropdown(): void {
    this.showNotifDropdown = !this.showNotifDropdown;
    this.showSearchDropdown = false;
  }

  marcarLeida(n: Notificacion): void {
    if (!n.leida) {
      this.notificacionService.marcarLeida(n.id).subscribe();
    }
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas().subscribe();
  }

  timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60)  return 'hace un momento';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
    return `hace ${Math.floor(seconds / 86400)} d`;
  }

  // ── Auth ──────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.logoutLocal();
        this.router.navigate(['/login']);
      }
    });
  }
}

