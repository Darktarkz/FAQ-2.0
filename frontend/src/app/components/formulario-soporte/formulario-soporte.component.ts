import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService, Ticket } from '../../services/ticket.service';
import { FormularioCampoService, FormularioCampo } from '../../services/formulario-campo.service';

@Component({
  selector: 'app-formulario-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario-soporte.component.html',
  styleUrls: ['./formulario-soporte.component.css']
})
export class FormularioSoporteComponent implements OnInit {
  @Input() moduloId!: number;
  @Input() moduloNombre!: string;

  // Campos personalizados del módulo
  camposPersonalizados: FormularioCampo[] = [];
  valoresCamposPersonalizados: { [key: string]: any } = {};
  
  enviando: boolean = false;
  cargandoFormulario: boolean = false;
  mostrarExito: boolean = false;
  mostrarError: boolean = false;
  mensajeError: string = '';
  numeroTicket: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private ticketService: TicketService,
    private formularioCampoService: FormularioCampoService
  ) {}

  ngOnInit(): void {
    this.cargarCamposPersonalizados();
  }

  cargarCamposPersonalizados(): void {
    this.cargandoFormulario = true;
    
    this.formularioCampoService.getPorModulo(this.moduloId).subscribe({
      next: (response) => {
        if (response.success && response.campos) {
          // Solo campos visibles
          this.camposPersonalizados = response.campos.filter(campo => campo.visible);
          
          // Inicializar valores
          this.camposPersonalizados.forEach(campo => {
            if (campo.tipo === 'checkbox') {
              this.valoresCamposPersonalizados[campo.nombre_campo] = false;
            } else if (campo.tipo === 'radio' || campo.tipo === 'select') {
              this.valoresCamposPersonalizados[campo.nombre_campo] = campo.opciones?.[0] || '';
            } else {
              this.valoresCamposPersonalizados[campo.nombre_campo] = '';
            }
          });
        }
        this.cargandoFormulario = false;
      },
      error: (err) => {
        console.error('Error al cargar campos personalizados:', err);
        this.cargandoFormulario = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe exceder 5MB');
        return;
      }

      this.selectedFile = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarImagen(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onCampoFileSelected(event: any, nombreCampo: string): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe exceder 5MB');
        return;
      }

      this.valoresCamposPersonalizados[nombreCampo] = file;
    }
  }

  enviarTicket(): void {
    // Validar que haya al menos un campo configurado
    if (this.camposPersonalizados.length === 0) {
      this.mostrarError = true;
      this.mensajeError = 'Este módulo no tiene campos configurados. Contacta al administrador.';
      setTimeout(() => this.mostrarError = false, 5000);
      return;
    }

    // Validar campos personalizados requeridos
    for (const campo of this.camposPersonalizados) {
      if (campo.requerido) {
        const valor = this.valoresCamposPersonalizados[campo.nombre_campo];
        
        // Validar que el campo tenga valor (diferente a vacío, null, undefined o false para no-checkbox)
        if (valor === null || valor === undefined || 
            (typeof valor === 'string' && valor.trim() === '') ||
            (campo.tipo !== 'checkbox' && valor === false)) {
          this.mostrarError = true;
          this.mensajeError = `El campo "${campo.etiqueta}" es obligatorio`;
          setTimeout(() => this.mostrarError = false, 5000);
          return;
        }

        // Validar formato de email si el tipo es email
        if (campo.tipo === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(valor)) {
            this.mostrarError = true;
            this.mensajeError = `Por favor ingresa un correo electrónico válido en "${campo.etiqueta}"`;
            setTimeout(() => this.mostrarError = false, 5000);
            return;
          }
        }
      }
    }

    this.enviando = true;
    this.mostrarError = false;

    // Crear FormData
    const formData = new FormData();
    formData.append('modulo_id', this.moduloId.toString());

    // Preparar campos personalizados (separar archivos de otros datos)
    const camposData: { [key: string]: any } = {};
    let tieneArchivos = false;

    for (const campo of this.camposPersonalizados) {
      const valor = this.valoresCamposPersonalizados[campo.nombre_campo];
      
      if (campo.tipo === 'file' && valor instanceof File) {
        // Agregar archivo al FormData
        formData.append(`archivo_${campo.nombre_campo}`, valor);
        camposData[campo.nombre_campo] = valor.name; // Guardar nombre del archivo
        tieneArchivos = true;
      } else {
        camposData[campo.nombre_campo] = valor;
      }
    }

    // Agregar campos personalizados como JSON
    formData.append('campos_personalizados', JSON.stringify(camposData));

    // Enviar ticket
    this.ticketService.crearTicket(formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarExito = true;
          this.numeroTicket = response.ticket?.numero_ticket || '';
          this.resetearFormulario();
          
          setTimeout(() => {
            this.mostrarExito = false;
          }, 8000);
        } else {
          this.mostrarError = true;
          this.mensajeError = response.message || 'Error al crear el ticket';
          setTimeout(() => this.mostrarError = false, 5000);
        }
        this.enviando = false;
      },
      error: (error) => {
        console.error('Error al enviar ticket:', error);
        this.mostrarError = true;
        this.mensajeError = error.error?.message || 'Error al enviar el ticket. Por favor intenta nuevamente.';
        setTimeout(() => this.mostrarError = false, 5000);
        this.enviando = false;
      }
    });
  }

  resetearFormulario(): void {
    // Resetear campos personalizados
    this.camposPersonalizados.forEach(campo => {
      if (campo.tipo === 'checkbox') {
        this.valoresCamposPersonalizados[campo.nombre_campo] = false;
      } else if (campo.tipo === 'radio' || campo.tipo === 'select') {
        this.valoresCamposPersonalizados[campo.nombre_campo] = campo.opciones?.[0] || '';
      } else {
        this.valoresCamposPersonalizados[campo.nombre_campo] = '';
      }
    });
  }

  cerrarMensajeExito(): void {
    this.mostrarExito = false;
  }

  cerrarMensajeError(): void {
    this.mostrarError = false;
  }
}
