import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, CreateUserDto, UpdateUserDto } from '../../services/user.service';
import { User, AuthService } from '../../services/auth.service';
import { ModuloService, Modulo } from '../../services/modulo.service';
import { ToastService } from '../../services/toast.service';

interface ModuloJerarquico extends Modulo {
  nivel?: number;
}

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="au-page">
      <div class="au-header">
        <div class="au-header-left">
          <h2 class="au-title">Gestión de Usuarios</h2>
          <p class="au-subtitle">Administra usuarios y sus permisos de edición</p>
        </div>
        <div class="au-header-right">
          <div class="stat-pill">
            <span class="stat-pill-num">{{ usuarios.length }}</span>
            <span class="stat-pill-lbl">usuarios</span>
          </div>
          <div class="stat-pill admin">
            <span class="stat-pill-num">{{ countAdmins() }}</span>
            <span class="stat-pill-lbl">admins</span>
          </div>
          <button class="btn-refresh" (click)="cargarTodo()">↻ Refrescar</button>
        </div>
      </div>

      <div class="au-layout">
        <section class="au-card form-card">
          <div class="au-card-header">
            <h3 class="au-card-title">Crear Usuario</h3>
          </div>
          <form (ngSubmit)="guardar()" class="au-form">
            <div class="fg">
              <label class="fg-label">Nombre completo <span class="req">*</span></label>
              <input class="fg-input" [(ngModel)]="form.name" name="name" placeholder="Ej: Juan Pérez" required/>
            </div>
            <div class="fg">
              <label class="fg-label">Correo electrónico <span class="req">*</span></label>
              <input class="fg-input" [(ngModel)]="form.email" name="email" type="email" placeholder="usuario@ejemplo.com" required/>
            </div>
            <div class="fg">
              <label class="fg-label">Contraseña <span class="req">*</span></label>
              <input class="fg-input" [(ngModel)]="form.password" name="password" type="password" placeholder="Mínimo 6 caracteres" required/>
            </div>

            <div class="toggle-row">
              <div class="toggle-info">
                <span class="toggle-title">Administrador del sistema</span>
                <span class="toggle-desc">Acceso completo a todas las funciones</span>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" [(ngModel)]="form.is_admin" name="is_admin"/>
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
              </label>
            </div>

            <div class="mod-section">
              <p class="mod-section-title">Módulos permitidos</p>
              <div class="search-wrap">
                <input class="search-input" type="text" [(ngModel)]="busquedaModulos" name="busquedaModulos"
                  placeholder="Buscar módulo..." (ngModelChange)="filtrarModulos()"/>
              </div>
              <div class="mod-list" *ngIf="modulosJerarquicos.length; else noMods">
                <label *ngFor="let m of modulosFiltrados" class="mod-check"
                  [style.padding-left.px]="12 + (m.nivel || 0) * 18">
                  <input type="checkbox" [checked]="m.id !== undefined && isModuloSelected(m.id)"
                    (change)="onModuloChange(m.id, $event)"/>
                  <span class="chk"></span>
                  <span class="mod-lbl">
                    <span class="nivel-ind" *ngIf="m.nivel && m.nivel > 0">└─</span>
                    {{ m.nombre }}
                  </span>
                  <span class="root-badge" *ngIf="m.nivel === 0">Raíz</span>
                </label>
              </div>
              <ng-template #noMods>
                <p class="empty-small">Sin módulos disponibles</p>
              </ng-template>
            </div>

            <div class="au-form-actions">
              <button type="submit" class="btn-primary">Crear Usuario</button>
              <button type="button" class="btn-ghost" (click)="resetForm()">Limpiar</button>
            </div>
          </form>
        </section>

        <section class="au-card list-card">
          <div class="au-card-header between">
            <div class="header-with-count">
              <h3 class="au-card-title">Usuarios Registrados</h3>
              <span class="count-chip">{{ usuariosFiltrados.length }}</span>
            </div>
          </div>
          <div class="search-wrap" style="margin-top:4px">
            <input class="search-input" type="text" [(ngModel)]="busquedaUsuarios"
              placeholder="Buscar por nombre o correo..." (ngModelChange)="filtrarUsuarios()"/>
          </div>

          <div class="u-list" *ngIf="usuariosFiltrados.length; else sinUsers">
            <div *ngFor="let u of usuariosFiltrados" class="u-card" [class.es-yo]="u.id === usuarioActual?.id">
              <div class="u-top">
                <div class="u-avatar">{{ obtenerIniciales(u.name) }}</div>
                <div class="u-info">
                  <p class="u-name">{{ u.name }}</p>
                  <p class="u-email">{{ u.email }}</p>
                </div>
                <span class="rol-chip" [class.admin]="u.is_admin">{{ u.is_admin ? '👑 Admin' : '✏️ Editor' }}</span>
                <span class="yo-badge" *ngIf="u.id === usuarioActual?.id">Tú</span>
              </div>
              <div class="u-mods" *ngIf="u.modulos && u.modulos.length > 0">
                <span class="mod-tag" *ngFor="let mod of u.modulos">{{ mod.nombre }}</span>
              </div>
              <div class="u-mods empty-mods" *ngIf="!u.modulos || u.modulos.length === 0">
                Sin módulos asignados
              </div>
              <div class="u-actions">
                <button class="btn-edit-sm" (click)="abrirModalEdicion(u)">✏️ Editar</button>
                <button class="btn-del-sm" (click)="eliminar(u)" [disabled]="u.id === usuarioActual?.id">🗑️ Eliminar</button>
              </div>
            </div>
          </div>

          <ng-template #sinUsers>
            <div class="empty-large">
              <div class="empty-icon">👤</div>
              <p>No se encontraron usuarios</p>
            </div>
          </ng-template>
        </section>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="mostrarModalEdicion" (click)="cerrarModalEdicion()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h3 class="modal-title">Editar Usuario</h3>
          <button class="modal-close" (click)="cerrarModalEdicion()">×</button>
        </div>
        <form (ngSubmit)="actualizarUsuario()" class="au-form modal-body">
          <div class="fg">
            <label class="fg-label">Nombre completo <span class="req">*</span></label>
            <input class="fg-input" [(ngModel)]="formEdicion.name" name="edit-name" required/>
          </div>
          <div class="fg">
            <label class="fg-label">Correo electrónico <span class="req">*</span></label>
            <input class="fg-input" [(ngModel)]="formEdicion.email" name="edit-email" type="email" required/>
          </div>
          <div class="fg">
            <label class="fg-label">Nueva contraseña <small class="optional">(dejar en blanco para no cambiar)</small></label>
            <input class="fg-input" [(ngModel)]="formEdicion.password" name="edit-password" type="password" placeholder="Mínimo 6 caracteres"/>
          </div>
          <div class="toggle-row">
            <div class="toggle-info">
              <span class="toggle-title">Administrador del sistema</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="formEdicion.is_admin" name="edit-is-admin"/>
              <span class="toggle-track"><span class="toggle-thumb"></span></span>
            </label>
          </div>
          <div class="mod-section">
            <p class="mod-section-title">Módulos permitidos</p>
            <div class="search-wrap">
              <input class="search-input" type="text" [(ngModel)]="busquedaModulosEdicion" name="busquedaModulosEdicion"
                placeholder="Buscar módulo..." (input)="filtrarModulosEdicion()"/>
            </div>
            <div class="mod-list" *ngIf="modulosJerarquicos.length">
              <label *ngFor="let m of modulosEdicionFiltrados" class="mod-check"
                [style.padding-left.px]="12 + (m.nivel || 0) * 18">
                <input type="checkbox" [checked]="m.id !== undefined && isModuloEdicionSelected(m.id)"
                  (change)="onModuloEdicionChange(m.id, $event)"/>
                <span class="chk"></span>
                <span class="mod-lbl">
                  <span class="nivel-ind" *ngIf="m.nivel && m.nivel > 0">└─</span>
                  {{ m.nombre }}
                </span>
                <span class="root-badge" *ngIf="m.nivel === 0">Raíz</span>
              </label>
            </div>
          </div>
          <div class="modal-foot">
            <button type="submit" class="btn-primary">Actualizar</button>
            <button type="button" class="btn-ghost" (click)="cerrarModalEdicion()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing:border-box; font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    .au-page { max-width:1400px; margin:0 auto; padding:28px 24px; animation:fadeInPage .35s ease-out both; }
    @keyframes fadeInPage { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
    .au-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:28px; }
    .au-title { margin:0; font-size:26px; font-weight:700; color:#1A1A2E; }
    .au-subtitle { margin:4px 0 0; font-size:14px; color:#9197A3; }
    .au-header-right { display:flex; align-items:center; gap:10px; }
    .stat-pill { display:flex; align-items:center; gap:6px; background:#fff; border:1.5px solid #E8E4F8; border-radius:20px; padding:6px 14px; }
    .stat-pill.admin { border-color:#C4B5FD; background:#F0EDFF; }
    .stat-pill-num { font-weight:700; font-size:16px; color:#1A1A2E; }
    .stat-pill-lbl { font-size:12px; color:#9197A3; }
    .btn-refresh { background:#F0EDFF; color:#6C5ECF; border:none; padding:8px 18px; border-radius:10px; cursor:pointer; font-weight:600; font-size:14px; transition:all .2s; }
    .btn-refresh:hover { background:#E0D8FF; }
    .au-layout { display:grid; grid-template-columns:420px 1fr; gap:24px; align-items:start; }
    .au-card { background:#fff; border-radius:18px; box-shadow:0 4px 20px rgba(0,0,0,.05); padding:24px; }
    .form-card { position:sticky; top:24px; }
    .au-card-header { margin-bottom:20px; padding-bottom:16px; border-bottom:1.5px solid #F3F0FF; }
    .au-card-title { margin:0; font-size:18px; font-weight:700; color:#1A1A2E; }
    .between { display:flex; align-items:center; justify-content:space-between; }
    .header-with-count { display:flex; align-items:center; gap:10px; }
    .count-chip { background:#F0EDFF; color:#6C5ECF; font-weight:700; font-size:13px; padding:3px 10px; border-radius:20px; }
    .au-form { display:flex; flex-direction:column; gap:16px; }
    .fg { display:flex; flex-direction:column; gap:6px; }
    .fg-label { font-weight:600; font-size:13px; color:#1A1A2E; }
    .req { color:#E53E3E; }
    .fg-input { padding:10px 14px; border:1.5px solid #E2E8F0; border-radius:10px; font-size:14px; transition:border-color .2s,box-shadow .2s; outline:none; color:#1A1A2E; }
    .fg-input:focus { border-color:#6C5ECF; box-shadow:0 0 0 3px rgba(108,94,207,.12); }
    .toggle-row { display:flex; align-items:center; justify-content:space-between; background:#F8F7FF; border-radius:12px; padding:12px 16px; gap:12px; }
    .toggle-info { display:flex; flex-direction:column; gap:2px; }
    .toggle-title { font-weight:600; font-size:14px; color:#1A1A2E; }
    .toggle-desc { font-size:12px; color:#9197A3; }
    .toggle-switch { position:relative; display:inline-block; width:44px; height:24px; flex-shrink:0; cursor:pointer; }
    .toggle-switch input { opacity:0; width:0; height:0; position:absolute; }
    .toggle-track { display:block; width:44px; height:24px; background:#D1D5DB; border-radius:12px; transition:background .2s; position:relative; }
    .toggle-switch input:checked ~ .toggle-track { background:#6C5ECF; }
    .toggle-thumb { position:absolute; top:2px; left:2px; width:20px; height:20px; background:#fff; border-radius:50%; transition:transform .2s; box-shadow:0 1px 4px rgba(0,0,0,.2); }
    .toggle-switch input:checked ~ .toggle-track .toggle-thumb { transform:translateX(20px); }
    .mod-section { background:#F8F7FF; border-radius:12px; padding:14px; }
    .mod-section-title { margin:0 0 10px; font-weight:700; font-size:13px; color:#1A1A2E; }
    .search-wrap { margin-bottom:10px; }
    .search-input { width:100%; padding:9px 14px; border:1.5px solid #E2E8F0; border-radius:10px; font-size:13px; outline:none; transition:border-color .2s; color:#1A1A2E; }
    .search-input:focus { border-color:#6C5ECF; }
    .mod-list { max-height:260px; overflow-y:auto; display:flex; flex-direction:column; gap:2px; }
    .mod-check { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:8px; cursor:pointer; transition:background .15s; }
    .mod-check:hover { background:rgba(108,94,207,.07); }
    .mod-check input[type="checkbox"] { position:absolute; opacity:0; width:0; height:0; }
    .chk { width:18px; height:18px; border:1.5px solid #C4C8D1; border-radius:5px; flex-shrink:0; position:relative; transition:all .15s; background:#fff; }
    .mod-check input[type="checkbox"]:checked ~ .chk { background:#6C5ECF; border-color:#6C5ECF; }
    .mod-check input[type="checkbox"]:checked ~ .chk::after { content:''; position:absolute; top:3px; left:5px; width:5px; height:8px; border:2px solid #fff; border-top:none; border-left:none; transform:rotate(45deg); }
    .mod-lbl { flex:1; font-size:13px; color:#1A1A2E; display:flex; align-items:center; gap:4px; }
    .nivel-ind { color:#9197A3; font-size:11px; }
    .root-badge { background:#E0D8FF; color:#6C5ECF; padding:1px 7px; border-radius:10px; font-size:11px; font-weight:600; }
    .empty-small { margin:0; color:#9197A3; font-size:13px; text-align:center; padding:12px; }
    .optional { font-weight:400; color:#9197A3; }
    .au-form-actions { display:flex; gap:10px; }
    .btn-primary { flex:1; background:#6C5ECF; color:#fff; border:none; padding:11px 20px; border-radius:10px; cursor:pointer; font-weight:600; font-size:14px; transition:background .2s,transform .15s; }
    .btn-primary:hover { background:#5B4DB8; transform:translateY(-1px); }
    .btn-ghost { background:#F0EDFF; color:#6C5ECF; border:none; padding:11px 20px; border-radius:10px; cursor:pointer; font-weight:600; font-size:14px; transition:background .2s; }
    .btn-ghost:hover { background:#E0D8FF; }
    .u-list { display:flex; flex-direction:column; gap:12px; margin-top:16px; }
    .u-card { background:#fff; border:1.5px solid #EEE; border-radius:14px; padding:18px; position:relative; transition:border-color .2s,box-shadow .2s; }
    .u-card:hover { border-color:#6C5ECF; box-shadow:0 4px 16px rgba(108,94,207,.1); }
    .u-card.es-yo { border-color:#C4B5FD; background:#FDFCFF; }
    .u-top { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .u-avatar { width:44px; height:44px; border-radius:50%; background:#6C5ECF; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; flex-shrink:0; }
    .u-info { flex:1; min-width:0; }
    .u-name { margin:0; font-size:15px; font-weight:700; color:#1A1A2E; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .u-email { margin:2px 0 0; font-size:13px; color:#9197A3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .rol-chip { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; background:#F0EDFF; color:#6C5ECF; white-space:nowrap; }
    .rol-chip.admin { background:#6C5ECF; color:#fff; }
    .yo-badge { position:absolute; top:14px; right:14px; background:#6C5ECF; color:#fff; padding:3px 9px; border-radius:12px; font-size:11px; font-weight:700; }
    .u-mods { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; padding:10px; background:#F8F7FF; border-radius:10px; }
    .u-mods.empty-mods { color:#9197A3; font-size:12px; font-style:italic; }
    .mod-tag { background:#fff; border:1px solid #E2E8F0; padding:3px 9px; border-radius:14px; font-size:12px; color:#555; font-weight:500; }
    .u-actions { display:flex; gap:8px; }
    .btn-edit-sm { flex:1; padding:9px; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px; border:none; background:#E8F5E9; color:#2E7D32; transition:background .15s; }
    .btn-edit-sm:hover { background:#C8E6C9; }
    .btn-del-sm { flex:1; padding:9px; border-radius:8px; cursor:pointer; font-weight:600; font-size:13px; border:none; background:#FFF0F0; color:#C62828; transition:background .15s; }
    .btn-del-sm:hover:not(:disabled) { background:#FFCDD2; }
    .btn-del-sm:disabled { opacity:.4; cursor:not-allowed; }
    .empty-large { text-align:center; padding:60px 20px; }
    .empty-icon { font-size:60px; opacity:.25; margin-bottom:12px; }
    .empty-large p { font-size:15px; color:#9197A3; margin:0; }
    .modal-overlay { position:fixed; inset:0; background:rgba(26,26,46,.55); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-box { background:#fff; border-radius:20px; width:90%; max-width:580px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,.2); animation:slideUp .4s cubic-bezier(.34,1.56,.64,1) both; }
    @keyframes slideUp { from { transform:translateY(40px) scale(.96); opacity:0; } to { transform:translateY(0) scale(1); opacity:1; } }
    .modal-head { display:flex; align-items:center; justify-content:space-between; padding:22px 24px; border-bottom:1.5px solid #F3F0FF; }
    .modal-title { margin:0; font-size:20px; font-weight:700; color:#1A1A2E; }
    .modal-close { background:none; border:none; font-size:28px; color:#9197A3; cursor:pointer; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:background .15s; line-height:1; }
    .modal-close:hover { background:#F3F0FF; color:#1A1A2E; }
    .modal-body { padding:24px; }
    .modal-foot { display:flex; gap:10px; margin-top:8px; }
    @media(max-width:1200px) { .au-layout { grid-template-columns:1fr; } .form-card { position:static; } }
    @media(max-width:640px) { .au-page { padding:16px; } .au-header { flex-direction:column; align-items:flex-start; } .u-top { flex-wrap:wrap; } .u-actions { flex-direction:column; } }
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

  constructor(
    private userService: UserService,
    private moduloService: ModuloService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

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
        this.toast.error('Error al cargar usuarios');
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
        this.toast.error('Error al cargar módulos');
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

  isModuloSelected(id: number): boolean {
    const moduloId = Number(id);
    return (this.form.modulos || []).map(Number).includes(moduloId);
  }

  isModuloEdicionSelected(id: number): boolean {
    const moduloId = Number(id);
    return (this.formEdicion.modulos || []).map(Number).includes(moduloId);
  }

  onModuloChange(id: number | undefined, event: Event) {
    if (!id) return;
    const moduloId = Number(id);
    const checked = (event.target as HTMLInputElement).checked;
    const currentModulos = new Set((this.form.modulos || []).map(Number));

    if (checked) {
      currentModulos.add(moduloId);
    } else {
      currentModulos.delete(moduloId);
    }

    this.form.modulos = Array.from(currentModulos);
  }

  onModuloEdicionChange(id: number | undefined, event: Event) {
    if (!id) return;
    const moduloId = Number(id);
    const checked = (event.target as HTMLInputElement).checked;
    const currentModulos = new Set((this.formEdicion.modulos || []).map(Number));

    if (checked) {
      currentModulos.add(moduloId);
    } else {
      currentModulos.delete(moduloId);
    }

    this.formEdicion.modulos = Array.from(currentModulos);
  }

  guardar() {
    if (!this.form.name.trim() || !this.form.email.trim()) {
      this.toast.error('Nombre y correo son obligatorios');
      return;
    }
    if (!this.form.password || this.form.password.length < 6) {
      this.toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    this.userService.create(this.form).subscribe({
      next: () => {
        this.toast.success('Usuario creado exitosamente');
        this.cargarUsuarios();
        this.resetForm();
      },
      error: (err) => {
        const mensaje = err.error?.message || 'Error al crear usuario';
        this.toast.error(mensaje);
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
      modulos: (u.modulos || [])
        .map(m => Number(m.id))
        .filter(id => Number.isFinite(id))
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
      this.toast.error('Nombre y correo son obligatorios');
      return;
    }
    if (this.formEdicion.password && this.formEdicion.password.length < 6) {
      this.toast.error('La contraseña debe tener al menos 6 caracteres');
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
        this.toast.success('Usuario actualizado exitosamente');
        this.cargarUsuarios();
        this.cerrarModalEdicion();
      },
      error: (err) => {
        const mensaje = err.error?.message || 'Error al actualizar usuario';
        this.toast.error(mensaje);
      }
    });
  }

  eliminar(u: User) {
    if (u.id === this.usuarioActual?.id) {
      this.toast.error('No puedes eliminarte a ti mismo');
      return;
    }
    this.toast.confirm(`¿Eliminar a ${u.name}? Esta acción no se puede deshacer.`).then(ok => {
      if (!ok) return;
      this.userService.remove(u.id).subscribe({
        next: () => {
          this.toast.success('Usuario eliminado exitosamente');
          this.cargarUsuarios();
        },
        error: (err) => {
          const mensaje = err.error?.message || 'No se pudo eliminar el usuario';
          this.toast.error(mensaje);
        }
      });
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

  countAdmins(): number {
    return this.usuarios.filter(u => u.is_admin).length;
  }
}
