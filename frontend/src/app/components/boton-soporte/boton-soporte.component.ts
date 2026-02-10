import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-boton-soporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boton-soporte.component.html',
  styleUrls: ['./boton-soporte.component.css']
})
export class BotonSoporteComponent {
  @Input() moduloId!: number;
  @Input() moduloNombre!: string;
  @Input() posicion: 'fixed' | 'static' = 'fixed'; // fixed para flotante, static para integrado

  constructor(private router: Router) {}

  abrirFormularioSoporte(): void {
    // Navegar al formulario de soporte con los parámetros del módulo
    this.router.navigate(['/soporte'], {
      queryParams: {
        modulo_id: this.moduloId,
        modulo_nombre: this.moduloNombre
      }
    });
  }
}
