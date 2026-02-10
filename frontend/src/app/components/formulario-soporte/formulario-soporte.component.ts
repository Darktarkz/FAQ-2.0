import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService, Ticket } from '../../services/ticket.service';
import { FormularioConfigService, FormularioConfig } from '../../services/formulario-config.service';

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

  // Configuración de campos a mostrar
  config: FormularioConfig = {
    modulo_id: 0,
    mostrar_tipo_identificacion: true,
    mostrar_cedula: true,
    mostrar_telefono: true,
    mostrar_numero_contrato: false,
    mostrar_screenshot: true
  };

  // Datos del formulario
  ticket: Ticket = {
    modulo_id: 0,
    nombre_completo: '',
    tipo_identificacion: 'CC',
    cedula: '',
    correo: '',
    telefono: '',
    numero_contrato: '',
    descripcion: ''
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  
  enviando: boolean = false;
  cargandoFormulario: boolean = false;
  mostrarExito: boolean = false;
  mostrarError: boolean = false;
  mensajeError: string = '';
  numeroTicket: string = '';

  tiposIdentificacion = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' },
    { value: 'TI', label: 'Tarjeta de Identidad' },
    { value: 'PA', label: 'Pasaporte' },
    { value: 'NIT', label: 'NIT' }
  ];

  constructor(
    private ticketService: TicketService,
    private formularioConfigService: FormularioConfigService
  ) {}

  ngOnInit(): void {
    this.ticket.modulo_id = this.moduloId;
    this.cargarConfiguracion();
  }

  cargarConfiguracion(): void {
    this.cargandoFormulario = true;
    
    this.formularioConfigService.getPorModulo(this.moduloId).subscribe({
      next: (response) => {
        if (response.success && response.config) {
          this.config = response.config;
        }
        this.cargandoFormulario = false;
      },
      error: (err) => {
        console.error('Error al cargar configuración:', err);
        // Usar configuración por defecto
        this.cargandoFormulario = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

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
    const fileInput = document.getElementById('screenshot') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  enviarTicket(): void {
    // Validar campos requeridos
    if (!this.ticket.nombre_completo || !this.ticket.correo || !this.ticket.descripcion) {
      this.mostrarError = true;
      this.mensajeError = 'Por favor completa todos los campos obligatorios';
      setTimeout(() => this.mostrarError = false, 5000);
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.ticket.correo)) {
      this.mostrarError = true;
      this.mensajeError = 'Por favor ingresa un correo electrónico válido';
      setTimeout(() => this.mostrarError = false, 5000);
      return;
    }

    this.enviando = true;
    this.mostrarError = false;

    // Crear FormData
    const formData = new FormData();
    formData.append('modulo_id', this.ticket.modulo_id.toString());
    formData.append('nombre_completo', this.ticket.nombre_completo);
    formData.append('tipo_identificacion', this.ticket.tipo_identificacion || '');
    formData.append('cedula', this.ticket.cedula || '');
    formData.append('correo', this.ticket.correo);
    formData.append('telefono', this.ticket.telefono || '');
    formData.append('numero_contrato', this.ticket.numero_contrato || '');
    formData.append('descripcion', this.ticket.descripcion);

    if (this.selectedFile) {
      formData.append('screenshot', this.selectedFile);
    }

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
    this.ticket = {
      modulo_id: this.moduloId,
      nombre_completo: '',
      tipo_identificacion: 'CC',
      cedula: '',
      correo: '',
      telefono: '',
      numero_contrato: '',
      descripcion: ''
    };
    
    this.selectedFile = null;
    this.previewUrl = null;
    const fileInput = document.getElementById('screenshot') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  cerrarMensajeExito(): void {
    this.mostrarExito = false;
  }

  cerrarMensajeError(): void {
    this.mostrarError = false;
  }
}
