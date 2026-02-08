import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { PreguntasComponent } from './components/preguntas/preguntas.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminPreguntasComponent } from './components/admin-preguntas/admin-preguntas.component';
import { AdminModulosComponent } from './components/admin-modulos/admin-modulos.component';
import { AdminCategoriasComponent } from './components/admin-categorias/admin-categorias.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { AdminUsuariosComponent } from './components/admin-usuarios/admin-usuarios.component';

export const routes: Routes = [
  { path: '', redirectTo: 'preguntas', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'preguntas',
    component: PreguntasComponent
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        component: AdminDashboardComponent
      },
      {
        path: 'preguntas',
        component: AdminPreguntasComponent
      },
      {
        path: 'modulos',
        component: AdminModulosComponent
      },
      {
        path: 'categorias',
        component: AdminCategoriasComponent
      },
      {
        path: 'usuarios',
        component: AdminUsuariosComponent
      }
    ]
  },
  { path: '**', redirectTo: 'preguntas' }
];
