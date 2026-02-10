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

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener parámetros de la URL
    this.route.queryParams.subscribe(params => {
      this.moduloId = +params['modulo_id'] || 0;
      this.moduloNombre = params['modulo_nombre'] || 'Módulo no especificado';
    });
  }

  volver(): void {
    window.history.back();
  }
}
