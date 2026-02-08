import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      if (this.authService.isAdmin() || this.authService.hasModulePermissions()) {
        return true;
      } else {
        // Usuario logueado pero no es admin
        this.router.navigate(['/preguntas']);
        return false;
      }
    }

    // Usuario no logueado
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
