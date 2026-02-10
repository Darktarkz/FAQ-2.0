import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <div class="admin-container" [class.no-sidebar]="!isPrivileged">
      <aside class="admin-sidebar" *ngIf="isPrivileged">
        <div class="sidebar-header">
          <h2>Administración</h2>
        </div>
        <nav class="sidebar-nav">
          <a routerLink="/admin" [routerLinkActiveOptions]="{exact: true}" routerLinkActive="active">
            <span class="icon">📊</span> Dashboard
          </a>
          <a *ngIf="isAdmin" routerLink="/admin/categorias" routerLinkActive="active">
            <span class="icon">📁</span> Categorías
          </a>
          <a routerLink="/admin/modulos" routerLinkActive="active">
            <span class="icon">📦</span> Módulos
          </a>
          <a *ngIf="isAdmin" routerLink="/admin/usuarios" routerLinkActive="active">
            <span class="icon">👥</span> Usuarios
          </a>
          <a routerLink="/admin/preguntas" routerLinkActive="active">
            <span class="icon">❓</span> Preguntas
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <span class="user-name">{{ userName }}</span>
          </div>
          <button (click)="logout()" class="btn-logout">Cerrar sesión</button>
        </div>
      </aside>

      <main class="admin-main">
        <header class="admin-header" *ngIf="isPrivileged">
          <h1>Panel de Administración</h1>
          <div class="header-info">
            <span>{{ userName }}</span>
          </div>
        </header>
        <div class="admin-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-container {
      display: flex;
      height: 100vh;
      background: #f5f5f5;

      &.no-sidebar {
        .admin-main {
          width: 100%;
        }
      }
    }

    .admin-sidebar {
      width: 250px;
      background: #39275c;
      color: white;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    }

    .sidebar-header {
      padding: 25px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      h2 {
        margin: 0;
        color: #ebe9f2;
        font-size: 1.3em;
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 0;
      display: flex;
      flex-direction: column;

      a {
        padding: 15px 20px;
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s ease;
        border-left: 3px solid transparent;

        .icon {
          filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
          font-size: 1.2rem;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-left-color: white;
        }

        &.active {
          background: rgba(255, 255, 255, 0.2);
          border-left-color: white;
          font-weight: bold;
        }
      }
    }

    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 12px;

      .user-info {
        font-size: 0.9em;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        text-align: center;

        .user-name {
          display: block;
          font-weight: bold;
        }
      }
    }

    .btn-logout {
      width: 100%;
      padding: 10px;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      width: calc(100% - 250px);
      transition: width 0.3s ease;
    }

    .admin-header {
      background: white;
      padding: 25px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h1 {
        margin: 0;
        color: #333;
      }

      .header-info {
        color: #666;
        font-size: 0.9em;
      }
    }

    .admin-content {
      flex: 1;
      overflow-y: auto;
      padding: 30px;
    }
  `]
})
export class AdminLayoutComponent implements OnInit {
  isAdmin = false;
  isEditor = false;
  isPrivileged = false;
  userName = 'Usuario';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('AdminLayoutComponent inicializado');
    
    const user = this.authService.getUser();
    this.isAdmin = this.authService.isAdmin();
    this.isEditor = !this.isAdmin && this.authService.hasModulePermissions();
    this.isPrivileged = this.isAdmin || this.isEditor;
    
    console.log('Estado del admin:', {
      isAdmin: this.isAdmin,
      user: user
    });

    if (user) {
      this.userName = user.name;
    }

    // Si no es admin, redirigir
    if (!this.isPrivileged) {
      console.log('No tiene permisos de administración, redirigiendo a preguntas');
      this.router.navigate(['/preguntas']);
    }
  }

  logout() {
    console.log('Cerrando sesión...');
    this.authService.logout().subscribe({
      next: () => {
        console.log('✓ Sesión cerrada');
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        console.error('Error al cerrar sesión:', error);
        // Limpiar sesión localmente aunque haya error
        this.authService.logoutLocal();
        this.router.navigate(['/login']);
      }
    });
  }
}

