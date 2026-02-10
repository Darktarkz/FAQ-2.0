import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, CreateUserDto, UpdateUserDto } from '../../services/user.service';
import { User, AuthService } from '../../services/auth.service';
import { ModuloService, Modulo } from '../../services/modulo.service';

interface ModuloJerarquico extends Modulo {
  nivel?: number;
}

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-usuarios">
      <div class="page-header">
        <div>
          <h2>👥 Gestión de Usuarios</h2>
          <p class="subtitle">Administra usuarios y sus permisos de edición</p>
        </div>
        <button class="btn-refresh" (click)="cargarTodo()">↻ Refrescar</button>
      </div>

      <div class="notification" *ngIf="notificacion" [class.success]="notificacion.tipo === 'success'" [class.error]="notificacion.tipo === 'error'">
        <span>{{ notificacion.tipo === 'success' ? '✓' : '⚠' }}</span>
        <span>{{ notificacion.mensaje }}</span>
        <button class="close-notif" (click)="cerrarNotificacion()">×</button>
      </div>

      <div class="layout">
        <section class="card form-card">
          <div class="card-header">
            <h3>➕ Crear Nuevo Usuario</h3>
          </div>
          <form (ngSubmit)="guardar()" class="form">
            <div class="form-group">
              <label for="name">
                <span>Nombre completo</span>
                <span class="required">*</span>
              </label>
              <input id="name" [(ngModel)]="form.name" name="name" placeholder="Ej: Juan Pérez" required/>
            </div>

            <div class="form-group">
              <label for="email">
                <span>Correo electrónico</span>
                <span class="required">*</span>
              </label>
              <input id="email" [(ngModel)]="form.email" name="email" type="email" placeholder="usuario@ejemplo.com" required/>
            </div>

            <div class="form-group">
              <label for="password">
                <span>Contraseña</span>
                <span class="required">*</span>
              </label>
              <input id="password" [(ngModel)]="form.password" name="password" type="password" placeholder="Mínimo 6 caracteres" required/>
            </div>

            <div class="checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.is_admin" name="is_admin"/>
                <span class="checkmark"></span>
                <div class="checkbox-info">
                  <span class="checkbox-title">Administrador del sistema</span>
                  <span class="checkbox-desc">Acceso completo a todas las funciones</span>
                </div>
              </label>
            </div>

            <div class="modulos-section">
              <div class="modulos-header">
                <span class="section-title">📚 Módulos Permitidos</span>
                <small class="section-desc">El usuario podrá gestionar preguntas en estos módulos</small>
              </div>
              
              <div class="search-box">
                <input type="text" [(ngModel)]="busquedaModulos" name="busquedaModulos" placeholder="🔍 Buscar módulo..." (ngModelChange)="filtrarModulos()"/>
              </div>

              <div class="modulos-list" *ngIf="modulosJerarquicos.length; else noModulos">
                <label *ngFor="let modulo of modulosFiltrados" class="modulo-checkbox" [style.padding-left.px]="16 + (modulo.nivel || 0) * 20">
                  <input type="checkbox" [value]="modulo.id" [checked]="modulo.id !== undefined && form.modulos?.includes(modulo.id)" (change)="modulo.id !== undefined && toggleModulo(modulo.id)"/>
                  <span class="checkmark"></span>
                  <span class="modulo-nombre">
                    <span class="nivel-indicator" *ngIf="modulo.nivel && modulo.nivel > 0">└─</span>
                    {{ modulo.nombre }}
                  </span>
                  <span class="modulo-badge" *ngIf="modulo.nivel === 0">Raíz</span>
                </label>
              </div>
              <ng-template #noModulos>
                <p class="empty-state">😕 No hay módulos disponibles</p>
              </ng-template>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">✓ Crear Usuario</button>
              <button type="button" class="btn-secondary" (click)="resetForm()">↺ Limpiar</button>
            </div>
          </form>
        </section>

        <section class="card usuarios-card">
          <div class="card-header between">
            <div>
              <h3>📋 Usuarios Registrados</h3>
              <span class="count-badge">{{ usuariosFiltrados.length }} usuario{{ usuariosFiltrados.length !== 1 ? 's' : '' }}</span>
            </div>
          </div>

          <div class="search-box">
            <input type="text" [(ngModel)]="busquedaUsuarios" placeholder="🔍 Buscar por nombre o correo..." (ngModelChange)="filtrarUsuarios()"/>
          </div>

          <div class="usuarios-list" *ngIf="usuariosFiltrados.length; else sinUsuarios">
            <div *ngFor="let u of usuariosFiltrados" class="usuario-card" [class.es-actual]="u.id === usuarioActual?.id">
              <div class="usuario-header">
                <div class="usuario-avatar">{{ obtenerIniciales(u.name) }}</div>
                <div class="usuario-info">
                  <h4 class="usuario-nombre">{{ u.name }}</h4>
                  <p class="usuario-email">{{ u.email }}</p>
                </div>
                <div class="usuario-rol">
                  <span class="rol-badge" [class.admin]="u.is_admin">{{ u.is_admin ? '👑 Admin' : '✏️ Editor' }}</span>
                </div>
              </div>

              <div class="usuario-modulos" *ngIf="u.modulos && u.modulos.length > 0">
                <span class="modulos-title">Módulos asignados:</span>
                <div class="modulos-tags">
                  <span class="modulo-tag" *ngFor="let m of u.modulos">{{ m.nombre }}</span>
                </div>
              </div>
              <div class="usuario-modulos" *ngIf="!u.modulos || u.modulos.length === 0">
                <span class="sin-modulos">Sin módulos asignados</span>
              </div>

              <div class="usuario-actions">
                <button class="btn-edit" (click)="abrirModalEdicion(u)">✏️ Editar</button>
                <button class="btn-delete" (click)="eliminar(u)" [disabled]="u.id === usuarioActual?.id">🗑️ Eliminar</button>
              </div>

              <div class="usuario-actual-badge" *ngIf="u.id === usuarioActual?.id">Tú</div>
            </div>
          </div>
          
          <ng-template #sinUsuarios>
            <div class="empty-state-large">
              <div class="empty-icon">👤</div>
              <p>No se encontraron usuarios</p>
            </div>
          </ng-template>
        </section>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="mostrarModalEdicion" (click)="cerrarModalEdicion()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>✏️ Editar Usuario</h3>
          <button class="btn-close-modal" (click)="cerrarModalEdicion()">×</button>
        </div>

        <form (ngSubmit)="actualizarUsuario()" class="modal-form">
          <div class="form-group">
            <label for="edit-name">
              <span>Nombre completo</span>
              <span class="required">*</span>
            </label>
            <input id="edit-name" [(ngModel)]="formEdicion.name" name="edit-name" required/>
          </div>

          <div class="form-group">
            <label for="edit-email">
              <span>Correo electrónico</span>
              <span class="required">*</span>
            </label>
            <input id="edit-email" [(ngModel)]="formEdicion.email" name="edit-email" type="email" required/>
          </div>

          <div class="form-group">
            <label for="edit-password">
              <span>Nueva contraseña</span>
            </label>
            <input id="edit-password" [(ngModel)]="formEdicion.password" name="edit-password" type="password" placeholder="Dejar en blanco para mantener actual"/>
            <small class="help-text">Solo completa si deseas cambiar la contraseña</small>
          </div>

          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="formEdicion.is_admin" name="edit-is-admin"/>
              <span class="checkmark"></span>
              <div class="checkbox-info">
                <span class="checkbox-title">Administrador del sistema</span>
              </div>
            </label>
          </div>

          <div class="modulos-section">
            <div class="modulos-header">
              <span class="section-title">📚 Módulos Permitidos</span>
            </div>
            
            <div class="search-box">
              <input type="text" [(ngModel)]="busquedaModulosEdicion" name="busquedaModulosEdicion" placeholder="🔍 Buscar módulo..." (input)="filtrarModulosEdicion()"/>
            </div>

            <div class="modulos-list" *ngIf="modulosJerarquicos.length">
              <label *ngFor="let modulo of modulosEdicionFiltrados" class="modulo-checkbox" [style.padding-left.px]="16 + (modulo.nivel || 0) * 20">
                <input type="checkbox" [value]="modulo.id" [checked]="modulo.id !== undefined && formEdicion.modulos?.includes(modulo.id)" (change)="modulo.id !== undefined && toggleModuloEdicion(modulo.id)"/>
                <span class="checkmark"></span>
                <span class="modulo-nombre">
                  <span class="nivel-indicator" *ngIf="modulo.nivel && modulo.nivel > 0">└─</span>
                  {{ modulo.nombre }}
                </span>
                <span class="modulo-badge" *ngIf="modulo.nivel === 0">Raíz</span>
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-primary">✓ Actualizar</button>
            <button type="button" class="btn-secondary" (click)="cerrarModalEdicion()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .admin-usuarios { max-width: 1400px; margin: 0 auto; padding: 24px; background: linear-gradient(135deg, #f5f3f7 0%, #f9f8fa 100%); min-height: 100vh; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; background: white; padding: 20px 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(101, 85, 143, 0.1); }
    .page-header h2 { margin: 0; color: #65558F; font-size: 28px; font-weight: 700; }
    .subtitle { color: #666; margin: 4px 0 0 0; font-size: 14px; }
    .btn-refresh { background: linear-gradient(135deg, #65558F 0%, #7e6ba3 100%); color: white; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; }
    .btn-refresh:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(101, 85, 143, 0.3); }
    .notification { padding: 16px 20px; border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; font-weight: 500; animation: slideIn 0.3s ease; }
    .notification.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .notification.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .close-notif { margin-left: auto; background: none; border: none; font-size: 24px; cursor: pointer; opacity: 0.6; }
    .close-notif:hover { opacity: 1; }
    .layout { display: grid; grid-template-columns: 450px 1fr; gap: 24px; align-items: start; }
    .card { background: white; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); padding: 24px; transition: box-shadow 0.3s ease; }
    .card:hover { box-shadow: 0 6px 20px rgba(101, 85, 143, 0.15); }
    .form-card { position: sticky; top: 24px; }
    .card-header { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f0f0f0; }
    .card-header h3 { margin: 0; color: #333; font-size: 20px; font-weight: 700; }
    .between { display: flex; align-items: center; justify-content: space-between; }
    .count-badge { display: inline-block; background: linear-gradient(135deg, #65558F 0%, #7e6ba3 100%); color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-left: 12px; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-weight: 600; color: #333; font-size: 14px; display: flex; align-items: center; gap: 4px; }
    .required { color: #e74c3c; font-weight: 700; }
    input[type="text"], input[type="email"], input[type="password"] { padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; transition: all 0.3s ease; font-family: inherit; }
    input:focus { outline: none; border-color: #65558F; box-shadow: 0 0 0 3px rgba(101, 85, 143, 0.1); }
    .checkbox-group { margin: 8px 0; }
    .checkbox-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; transition: all 0.3s ease; }
    .checkbox-label:hover { border-color: #65558F; background: #f9f8fa; }
    .checkbox-label input[type="checkbox"] { display: none; }
    .checkmark { width: 22px; height: 22px; border: 2px solid #ddd; border-radius: 6px; flex-shrink: 0; position: relative; transition: all 0.3s ease; }
    .checkbox-label input[type="checkbox"]:checked + .checkmark { background: #65558F; border-color: #65558F; }
    .checkbox-label input[type="checkbox"]:checked + .checkmark::after { content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 14px; font-weight: bold; }
    .checkbox-info { display: flex; flex-direction: column; gap: 2px; }
    .checkbox-title { font-weight: 600; color: #333; }
    .checkbox-desc { font-size: 12px; color: #666; }
    .modulos-section { border: 2px solid #e8e4f0; border-radius: 10px; padding: 16px; background: #fafafa; }
    .modulos-header { margin-bottom: 12px; }
    .section-title { font-weight: 700; color: #333; font-size: 15px; }
    .section-desc { display: block; color: #666; font-size: 12px; margin-top: 4px; }
    .modulos-list { max-height: 280px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 8px; background: white; padding: 8px; }
    .modulo-checkbox { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; border-bottom: 1px solid #f5f5f5; }
    .modulo-checkbox:last-child { border-bottom: none; }
    .modulo-checkbox:hover { background: #f9f8fa; }
    .modulo-checkbox input[type="checkbox"] { display: none; }
    .modulo-nombre { flex: 1; font-size: 14px; color: #333; display: flex; align-items: center; gap: 6px; }
    .nivel-indicator { color: #999; font-size: 12px; }
    .modulo-badge { background: #65558F; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .search-box { margin-bottom: 12px; }
    .search-box input { width: 100%; padding: 10px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 14px; transition: all 0.3s ease; }
    .search-box input:focus { outline: none; border-color: #65558F; box-shadow: 0 0 0 3px rgba(101, 85, 143, 0.1); }
    .form-actions { display: flex; gap: 12px; margin-top: 8px; }
    .btn-primary { flex: 1; background: linear-gradient(135deg, #65558F 0%, #7e6ba3 100%); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 15px; transition: all 0.3s ease; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(101, 85, 143, 0.3); }
    .btn-secondary { background: white; color: #65558F; border: 2px solid #65558F; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; }
    .btn-secondary:hover { background: #f9f8fa; }
    .usuarios-list { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .usuario-card { background: white; border: 2px solid #e8e4f0; border-radius: 12px; padding: 20px; transition: all 0.3s ease; position: relative; }
    .usuario-card:hover { border-color: #65558F; box-shadow: 0 4px 16px rgba(101, 85, 143, 0.15); transform: translateY(-2px); }
    .usuario-card.es-actual { border-color: #65558F; background: linear-gradient(135deg, #faf9fb 0%, #f5f3f7 100%); }
    .usuario-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .usuario-avatar { width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #65558F 0%, #7e6ba3 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; flex-shrink: 0; }
    .usuario-info { flex: 1; min-width: 0; }
    .usuario-nombre { margin: 0; font-size: 18px; font-weight: 700; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .usuario-email { margin: 4px 0 0 0; font-size: 14px; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .usuario-rol { flex-shrink: 0; }
    .rol-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; background: #e8e4f0; color: #65558F; }
    .rol-badge.admin { background: linear-gradient(135deg, #65558F 0%, #7e6ba3 100%); color: white; }
    .usuario-modulos { margin-bottom: 16px; padding: 12px; background: #fafafa; border-radius: 8px; }
    .modulos-title { font-size: 13px; color: #666; font-weight: 600; display: block; margin-bottom: 8px; }
    .modulos-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .modulo-tag { background: white; border: 1px solid #e0e0e0; padding: 4px 10px; border-radius: 16px; font-size: 12px; color: #555; font-weight: 500; }
    .sin-modulos { font-size: 13px; color: #999; font-style: italic; }
    .usuario-actions { display: flex; gap: 10px; }
    .btn-edit, .btn-delete { flex: 1; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s ease; border: none; }
    .btn-edit { background: #e8f5e9; color: #2e7d32; }
    .btn-edit:hover { background: #c8e6c9; transform: translateY(-2px); }
    .btn-delete { background: #ffebee; color: #c62828; }
    .btn-delete:hover:not(:disabled) { background: #ffcdd2; transform: translateY(-2px); }
    .btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
    .usuario-actual-badge { position: absolute; top: 12px; right: 12px; background: #65558F; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
    .empty-state { text-align: center; padding: 20px; color: #999; font-style: italic; }
    .empty-state-large { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.3; }
    .empty-state-large p { font-size: 16px; color: #666; margin: 0 0 8px 0; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.3s ease; }
    .modal-content { background: white; border-radius: 16px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); animation: slideUp 0.3s ease; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 24px; border-bottom: 2px solid #f0f0f0; }
    .modal-header h3 { margin: 0; font-size: 22px; color: #333; font-weight: 700; }
    .btn-close-modal { background: none; border: none; font-size: 32px; color: #999; cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s ease; }
    .btn-close-modal:hover { background: #f0f0f0; color: #333; }
    .modal-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal-actions { display: flex; gap: 12px; margin-top: 8px; }
    .help-text { font-size: 12px; color: #666; margin-top: 4px; }
    @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @media (max-width: 1200px) { .layout { grid-template-columns: 1fr; } .form-card { position: static; } }
    @media (max-width: 768px) { .admin-usuarios { padding: 16px; } .page-header { flex-direction: column; gap: 16px; align-items: stretch; } .usuario-header { flex-wrap: wrap; } .usuario-actions { flex-direction: column; } }
  `]
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: User[] = [];
  usuariosFiltrados: User[] = [];
  modulos: Modulo[] = [];
  modulosJerarquicos: ModuloJerarquico[] = [];
  modulosFiltrados: ModuloJerarquico[] = [];
  modulosEdicionFiltrados: ModuloJerarquico[] = [];
  form: CreateUserDto = { name: '', email: '', password: '', is_admin: false, modulos: [] };
  formEdicion: UpdateUserDto = { name: '', email: '', password: '', is_admin: false, modulos: [] };
  editandoModelos: number | null = null;
  usuarioActual: User | null = null;
  mostrarModalEdicion = false;
  busquedaUsuarios = '';
  busquedaModulos = '';
  busquedaModulosEdicion = '';
  notificacion: { mensaje: string; tipo: 'success' | 'error' } | null = null;

  constructor(private userService: UserService, private moduloService: ModuloService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }
    this.usuarioActual = this.authService.getUser();
    this.cargarTodo();
  }

  cargarTodo() {
    this.cargarUsuarios();
    this.cargarModulos();
  }

  cargarUsuarios() {
    this.userService.list().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.filtrarUsuarios();
      },
      error: (err) => {
        console.error('Error al cargar usuarios', err);
        this.mostrarNotificacion('Error al cargar usuarios', 'error');
      }
    });
  }

  cargarModulos() {
    this.moduloService.getModulos().subscribe({
      next: (mods) => {
        this.modulos = mods;
        this.construirJerarquia();
        this.filtrarModulos();
      },
      error: (err) => {
        console.error('Error al cargar módulos', err);
        this.mostrarNotificacion('Error al cargar módulos', 'error');
      }
    });
  }

  construirJerarquia() {
    const mapaModulos = new Map<number, ModuloJerarquico>();
    this.modulos.forEach(m => {
      if (m.id !== undefined) {
        mapaModulos.set(m.id, { ...m, nivel: 0 });
      }
    });

    const calcularNivel = (modulo: ModuloJerarquico, nivel: number = 0): void => {
      modulo.nivel = nivel;
      this.modulos.forEach(m => {
        if (m.idpadre === modulo.id && m.id !== undefined) {
          const hijo = mapaModulos.get(m.id);
          if (hijo) {
            calcularNivel(hijo, nivel + 1);
          }
        }
      });
    };

    this.modulos.forEach(m => {
      if ((!m.idpadre || m.idpadre === null) && m.id !== undefined) {
        const modulo = mapaModulos.get(m.id);
        if (modulo) {
          calcularNivel(modulo, 0);
        }
      }
    });

    this.modulosJerarquicos = Array.from(mapaModulos.values()).sort((a, b) => {
      if (a.nivel !== b.nivel) {
        return (a.nivel || 0) - (b.nivel || 0);
      }
      return (a.nombre || '').localeCompare(b.nombre || '');
    });
  }

  filtrarUsuarios() {
    const busqueda = this.busquedaUsuarios.toLowerCase().trim();
    if (!busqueda) {
      this.usuariosFiltrados = [...this.usuarios];
    } else {
      this.usuariosFiltrados = this.usuarios.filter(u =>
        u.name.toLowerCase().includes(busqueda) || u.email.toLowerCase().includes(busqueda)
      );
    }
  }

  filtrarModulos() {
    const busqueda = this.busquedaModulos.toLowerCase().trim();
    if (!busqueda) {
      this.modulosFiltrados = [...this.modulosJerarquicos];
    } else {
      this.modulosFiltrados = this.modulosJerarquicos.filter(m => m.nombre?.toLowerCase().includes(busqueda));
    }
  }

  filtrarModulosEdicion() {
    const busqueda = this.busquedaModulosEdicion.toLowerCase().trim();
    if (!busqueda) {
      this.modulosEdicionFiltrados = [...this.modulosJerarquicos];
    } else {
      this.modulosEdicionFiltrados = this.modulosJerarquicos.filter(m => m.nombre?.toLowerCase().includes(busqueda));
    }
  }

  toggleModulo(id: number) {
    const set = new Set(this.form.modulos || []);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.form.modulos = Array.from(set);
  }

  toggleModuloEdicion(id: number) {
    const set = new Set(this.formEdicion.modulos || []);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.formEdicion.modulos = Array.from(set);
  }

  guardar() {
    if (!this.form.name.trim() || !this.form.email.trim()) {
      this.mostrarNotificacion('Nombre y correo son obligatorios', 'error');
      return;
    }
    if (!this.form.password || this.form.password.length < 6) {
      this.mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    this.userService.create(this.form).subscribe({
      next: () => {
        this.mostrarNotificacion('Usuario creado exitosamente', 'success');
        this.cargarUsuarios();
        this.resetForm();
      },
      error: (err) => {
        const mensaje = err.error?.message || 'Error al crear usuario';
        this.mostrarNotificacion(mensaje, 'error');
      }
    });
  }

  abrirModalEdicion(u: User) {
    this.editandoModelos = u.id;
    this.formEdicion = {
      name: u.name,
      email: u.email,
      password: '',
      is_admin: u.is_admin,
      modulos: (u.modulos || []).map(m => m.id!).filter(id => id !== undefined)
    };
    this.busquedaModulosEdicion = '';
    this.filtrarModulosEdicion();
    this.mostrarModalEdicion = true;
  }

  cerrarModalEdicion() {
    this.mostrarModalEdicion = false;
    this.editandoModelos = null;
    this.formEdicion = { name: '', email: '', password: '', is_admin: false, modulos: [] };
  }

  actualizarUsuario() {
    if (!this.formEdicion.name?.trim() || !this.formEdicion.email?.trim()) {
      this.mostrarNotificacion('Nombre y correo son obligatorios', 'error');
      return;
    }
    if (this.formEdicion.password && this.formEdicion.password.length < 6) {
      this.mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    const payload: UpdateUserDto = {
      name: this.formEdicion.name,
      email: this.formEdicion.email,
      is_admin: this.formEdicion.is_admin,
      modulos: this.formEdicion.modulos,
    };
    if (this.formEdicion.password) {
      payload.password = this.formEdicion.password;
    }
    this.userService.update(this.editandoModelos!, payload).subscribe({
      next: () => {
        this.mostrarNotificacion('Usuario actualizado exitosamente', 'success');
        this.cargarUsuarios();
        this.cerrarModalEdicion();
      },
      error: (err) => {
        const mensaje = err.error?.message || 'Error al actualizar usuario';
        this.mostrarNotificacion(mensaje, 'error');
      }
    });
  }

  eliminar(u: User) {
    if (u.id === this.usuarioActual?.id) {
      this.mostrarNotificacion('No puedes eliminarte a ti mismo', 'error');
      return;
    }
    if (!confirm(`¿Estás seguro de eliminar a ${u.name}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }
    this.userService.remove(u.id).subscribe({
      next: () => {
        this.mostrarNotificacion('Usuario eliminado exitosamente', 'success');
        this.cargarUsuarios();
      },
      error: (err) => {
        const mensaje = err.error?.message || 'No se pudo eliminar el usuario';
        this.mostrarNotificacion(mensaje, 'error');
      }
    });
  }

  resetForm() {
    this.form = { name: '', email: '', password: '', is_admin: false, modulos: [] };
    this.busquedaModulos = '';
    this.filtrarModulos();
  }

  obtenerIniciales(nombre: string): string {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error') {
    this.notificacion = { mensaje, tipo };
    setTimeout(() => {
      this.notificacion = null;
    }, 5000);
  }

  cerrarNotificacion() {
    this.notificacion = null;
  }
}
