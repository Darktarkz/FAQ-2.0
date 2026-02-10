import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormularioConfigService, FormularioConfig } from '../../services/formulario-config.service';

interface ModuloConfig {
  modulo_id: number;
  modulo_nombre: string;
  config: FormularioConfig;
}

@Component({
  selector: 'app-config-formularios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-formularios.component.html',
  styleUrls: ['./config-formularios.component.css']
})
export class ConfigFormulariosComponent implements OnInit {
  configuraciones: ModuloConfig[] = [];
  cargando: boolean = false;
  guardando: number | null = null;
  error: string = '';
  exito: string = '';

  constructor(private formularioConfigService: FormularioConfigService) {}

  ngOnInit(): void {
    this.cargarConfiguraciones();
  }

  cargarConfiguraciones(): void {
    this.cargando = true;
    this.error = '';

    this.formularioConfigService.listarTodos().subscribe({
      next: (response) => {
        if (response.success && response.configuraciones) {
          this.configuraciones = response.configuraciones;
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar configuraciones:', err);
        this.error = 'Error al cargar las configuraciones';
        this.cargando = false;
      }
    });
  }

  guardarConfiguracion(moduloConfig: ModuloConfig): void {
    this.guardando = moduloConfig.modulo_id;
    this.error = '';
    this.exito = '';

    this.formularioConfigService.guardar(moduloConfig.config).subscribe({
      next: (response) => {
        if (response.success) {
          this.exito = `Configuración guardada para ${moduloConfig.modulo_nombre}`;
          setTimeout(() => this.exito = '', 3000);
        } else {
          this.error = response.message || 'Error al guardar';
        }
        this.guardando = null;
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.error = 'Error al guardar la configuración';
        this.guardando = null;
      }
    });
  }

  restablecerConfiguracion(moduloConfig: ModuloConfig): void {
    if (!confirm(`¿Restablecer la configuración de ${moduloConfig.modulo_nombre} a valores por defecto?`)) {
      return;
    }

    this.formularioConfigService.restablecer(moduloConfig.modulo_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.exito = `Configuración restablecida para ${moduloConfig.modulo_nombre}`;
          setTimeout(() => this.exito = '', 3000);
          this.cargarConfiguraciones();
        } else {
          this.error = response.message || 'Error al restablecer';
        }
      },
      error: (err) => {
        console.error('Error al restablecer:', err);
        this.error = 'Error al restablecer la configuración';
      }
    });
  }
}
