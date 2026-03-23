import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormularioSoporteComponent } from '../formulario-soporte/formulario-soporte.component';

@Component({
  selector: 'app-pagina-soporte',
  standalone: true,
  imports: [CommonModule, FormularioSoporteComponent],
  templateUrl: './pagina-soporte.component.html',
  styleUrls: ['./pagina-soporte.component.css']
})
export class PaginaSoporteComponent implements OnInit {
  moduloId: number = 0;
  moduloNombre: string = '';
  preguntaNombre: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Leer snapshot síncrono primero para que el hijo reciba el valor correcto desde el inicio
    const snap = this.route.snapshot.queryParams;
    this.moduloId = +snap['modulo_id'] || 0;
    this.moduloNombre = snap['modulo_nombre'] || 'Módulo no especificado';
    this.preguntaNombre = snap['pregunta_nombre'] || '';

    // También suscribirse por si hay navegación posterior
    this.route.queryParams.subscribe(params => {
      this.moduloId = +params['modulo_id'] || 0;
      this.moduloNombre = params['modulo_nombre'] || 'Módulo no especificado';
      this.preguntaNombre = params['pregunta_nombre'] || '';
    });
  }

  volver(): void {
    window.history.back();
  }
}
