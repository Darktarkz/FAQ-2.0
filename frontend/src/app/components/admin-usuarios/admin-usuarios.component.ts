import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, CreateUserDto, UpdateUserDto } from '../../services/user.service';
import { User, AuthService } from '../../services/auth.service';
import { ModuloService, Modulo } from '../../services/modulo.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-usuarios">
      <div class="page-header">
        <div>
          <h2>Gestión de Usuarios</h2>
          <p class="subtitle">Crea usuarios y asigna los módulos que pueden gestionar</p>
        </div>
        <button class="btn-refresh" (click)="cargarTodo()">↻ Refrescar</button>
      </div>

      <div class="grid">
        <section class="card">
          <div class="card-header">
            <h3>{{ editando ? 'Editar usuario' : 'Crear usuario' }}</h3>
          </div>
          <form (ngSubmit)="guardar()" class="form">
            <label>
              Nombre
              <input [(ngModel)]="form.name" name="name" required />
            </label>
            <label>
              Correo
              <input [(ngModel)]="form.email" name="email" type="email" required />
            </label>
            <label>
              Contraseña
              <input [(ngModel)]="form.password" name="password" type="password" [required]="!editando" placeholder="{{ editando ? 'Dejar en blanco para mantener' : '' }}" />
            </label>
            <label class="checkbox">
              <input type="checkbox" [(ngModel)]="form.is_admin" name="is_admin" /> Es administrador
            </label>

            <div class="modulos">
              <div class="modulos-header">
                <span>Módulos permitidos</span>
                <small>El usuario podrá crear/editar/eliminar preguntas en estos módulos y sus hijos</small>
              </div>
              <div class="modulos-list" *ngIf="modulos.length; else noModulos">
                <label *ngFor="let modulo of modulos" class="modulo-item">
                  <input type="checkbox" [value]="modulo.id" [checked]="modulo.id !== undefined && form.modulos?.includes(modulo.id)" (change)="modulo.id !== undefined && toggleModulo(modulo.id)" />
                  <span>{{ modulo.nombre }}</span>
                  <small *ngIf="modulo.idpadre">Hijo de ID {{ modulo.idpadre }}</small>
                </label>
              </div>
              <ng-template #noModulos>
                <p class="empty">No hay módulos cargados.</p>
              </ng-template>
            </div>

            <div class="actions">
              <button type="submit" class="btn-primary">{{ editando ? 'Actualizar' : 'Crear' }}</button>
              <button type="button" class="btn-secondary" (click)="resetForm()">Limpiar</button>
            </div>
          </form>
        </section>

        <section class="card">
          <div class="card-header between">
            <h3>Usuarios</h3>
            <span class="badge">{{ usuarios.length }}</span>
          </div>
          <div class="table-wrapper" *ngIf="usuarios.length; else sinUsuarios">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Módulos asignados</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of usuarios">
                  <td>{{ u.name }}</td>
                  <td>{{ u.email }}</td>
                  <td>
                    <span class="chip" [class.admin]="u.is_admin">{{ u.is_admin ? 'Admin' : 'Editor' }}</span>
                  </td>
                  <td>
                    <span *ngIf="!u.modulos || u.modulos.length === 0" class="muted">Sin módulos</span>
                    <div class="tags" *ngIf="u.modulos?.length">
                      <span class="tag" *ngFor="let m of u.modulos">{{ m.nombre }}</span>
                    </div>
                  </td>
                  <td class="acciones">
                    <button class="btn-link" (click)="editar(u)">Editar</button>
                    <button class="btn-link danger" (click)="eliminar(u)" [disabled]="u.id === usuarioActual?.id">Eliminar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #sinUsuarios>
            <p class="empty">No hay usuarios registrados.</p>
          </ng-template>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .admin-usuarios { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .subtitle { color: #666; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: #fff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 20px; }
    .card-header { margin-bottom: 16px; }
    .between { display: flex; align-items: center; justify-content: space-between; }
    .badge { background: #65558F; color: #fff; border-radius: 999px; padding: 4px 10px; font-size: 12px; }
    form.form { display: flex; flex-direction: column; gap: 12px; }
    label { display: flex; flex-direction: column; gap: 6px; color: #333; font-weight: 600; }
    input, select { padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
    .checkbox { flex-direction: row; align-items: center; gap: 8px; font-weight: 500; }
    .modulos { border: 1px solid #eee; border-radius: 8px; padding: 12px; background: #fafafa; }
    .modulos-header { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; color: #555; }
    .modulos-list { max-height: 220px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
    .modulo-item { background: #fff; border: 1px solid #eee; padding: 8px; border-radius: 6px; display: flex; flex-direction: column; gap: 4px; font-weight: 500; }
    .actions { display: flex; gap: 10px; margin-top: 6px; }
    .btn-primary { background: #65558F; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; }
    .btn-secondary { background: #e0e0e0; color: #333; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; }
    .btn-refresh { background: #f5f5f5; border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #f0f0f0; text-align: left; }
    .acciones { display: flex; gap: 8px; }
    .btn-link { background: none; border: none; padding: 0; color: #65558F; cursor: pointer; }
    .btn-link.danger { color: #c0392b; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag { background: #eef; padding: 4px 8px; border-radius: 999px; font-size: 12px; }
    .chip { padding: 4px 10px; border-radius: 999px; background: #e0e0e0; font-size: 12px; }
    .chip.admin { background: #65558F; color: #fff; }
    .muted { color: #888; }
    .empty { color: #888; font-style: italic; }
    @media (max-width: 960px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: User[] = [];
  modulos: Modulo[] = [];
  form: CreateUserDto = { name: '', email: '', password: '', is_admin: false, modulos: [] };
  editando = false;
  usuarioActual: User | null = null;
  editingUserId: number | null = null;

  constructor(
    private userService: UserService,
    private moduloService: ModuloService,
    private authService: AuthService,
    private router: Router
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
      next: (usuarios) => this.usuarios = usuarios,
      error: (err) => console.error('Error al cargar usuarios', err)
    });
  }

  cargarModulos() {
    this.moduloService.getModulos().subscribe({
      next: (mods) => this.modulos = mods,
      error: (err) => console.error('Error al cargar módulos', err)
    });
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

  guardar() {
    if (!this.form.name.trim() || !this.form.email.trim()) {
      alert('Nombre y correo son obligatorios');
      return;
    }

    if (this.editando) {
      const payload: UpdateUserDto = {
        name: this.form.name,
        email: this.form.email,
        is_admin: this.form.is_admin,
        modulos: this.form.modulos,
      };
      if (this.form.password) {
        payload.password = this.form.password;
      }

      this.userService.update(this.editingUserId!, payload).subscribe({
        next: () => {
          alert('Usuario actualizado');
          this.cargarUsuarios();
          this.resetForm();
        },
        error: (err) => alert(err.error?.message || 'Error al actualizar')
      });
    } else {
      this.userService.create(this.form).subscribe({
        next: () => {
          alert('Usuario creado');
          this.cargarUsuarios();
          this.resetForm();
        },
        error: (err) => alert(err.error?.message || 'Error al crear usuario')
      });
    }
  }

  editar(u: User) {
    this.editando = true;
    this.editingUserId = u.id;
    this.form = {
      name: u.name,
      email: u.email,
      password: '',
      is_admin: u.is_admin,
      modulos: (u.modulos || []).map(m => m.id!)
    };
  }

  eliminar(u: User) {
    if (!confirm(`¿Eliminar a ${u.name}?`)) return;
    this.userService.remove(u.id).subscribe({
      next: () => {
        alert('Usuario eliminado');
        this.cargarUsuarios();
      },
      error: (err) => alert(err.error?.message || 'No se pudo eliminar')
    });
  }

  resetForm() {
    this.editando = false;
    this.editingUserId = null;
    this.form = { name: '', email: '', password: '', is_admin: false, modulos: [] };
  }
}
