import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        // Redirigir a admin si es admin o tiene módulos asignados (editor)
        const hasModulePermissions = (response.user.permitted_modulos?.length ?? 0) > 0;
        
        if (response.user.is_admin || hasModulePermissions) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/preguntas']);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Error en el login';
      }
    });
  }
}
