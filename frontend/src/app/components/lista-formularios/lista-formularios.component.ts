import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormularioTemplateService, FormularioTemplate } from '../../services/formulario-template.service';

@Component({
  selector: 'app-lista-formularios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-formularios.component.html',
  styleUrl: './lista-formularios.component.css'
})
export class ListaFormulariosComponent implements OnInit {
  formularios: FormularioTemplate[] = [];
  cargando = false;
  error = '';
  formularioAEliminar: FormularioTemplate | null = null;

  constructor(
    private formularioService: FormularioTemplateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarFormularios();
  }

  cargarFormularios(): void {
    this.cargando = true;
    this.error = '';

    this.formularioService.getAll().subscribe({
      next: (response) => {
        if (response.success && response.formularios) {
          this.formularios = response.formularios;
        } else {
          this.error = response.message || 'Error al cargar formularios';
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar formularios:', err);
        this.error = 'Error de conexión al cargar formularios';
        this.cargando = false;
      }
    });
  }

  crearNuevo(): void {
    this.router.navigate(['/admin/formularios/nuevo']);
  }

  editarFormulario(id: number): void {
    this.router.navigate(['/admin/formularios/editar', id]);
  }

  verFormulario(id: number): void {
    this.router.navigate(['/admin/formularios/ver', id]);
  }

  confirmarEliminar(formulario: FormularioTemplate): void {
    this.formularioAEliminar = formulario;
  }

  cancelarEliminar(): void {
    this.formularioAEliminar = null;
  }

  eliminarFormulario(): void {
    if (!this.formularioAEliminar || !this.formularioAEliminar.id) return;

    this.formularioService.delete(this.formularioAEliminar.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarFormularios();
          this.formularioAEliminar = null;
        } else {
          this.error = response.message || 'Error al eliminar formulario';
        }
      },
      error: (err) => {
        console.error('Error al eliminar formulario:', err);
        this.error = 'Error de conexión al eliminar formulario';
      }
    });
  }

  duplicarFormulario(id: number): void {
    if (!confirm('¿Desea duplicar este formulario?')) return;

    this.formularioService.duplicate(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.cargarFormularios();
        } else {
          this.error = response.message || 'Error al duplicar formulario';
        }
      },
      error: (err) => {
        console.error('Error al duplicar formulario:', err);
        this.error = 'Error de conexión al duplicar formulario';
      }
    });
  }

  toggleActivo(formulario: FormularioTemplate): void {
    if (!formulario.id) return;

    const nuevoEstado = !formulario.activo;

    this.formularioService.update(formulario.id, { activo: nuevoEstado }).subscribe({
      next: (response) => {
        if (response.success) {
          formulario.activo = nuevoEstado;
        } else {
          this.error = response.message || 'Error al actualizar estado';
        }
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        this.error = 'Error de conexión al actualizar estado';
      }
    });
  }

  getModulosTexto(modulosIds: number[]): string {
    if (!modulosIds || modulosIds.length === 0) {
      return 'Sin asignar';
    }
    return `${modulosIds.length} módulo(s)`;
  }

  getCantidadCampos(formulario: FormularioTemplate): number {
    return formulario.campos ? formulario.campos.length : 0;
  }
}
