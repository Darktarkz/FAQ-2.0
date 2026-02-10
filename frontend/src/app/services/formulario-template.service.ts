import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FormularioCampo {
  id?: number;
  formulario_template_id?: number;
  nombre_campo: string;
  etiqueta: string;
  tipo: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio';
  placeholder?: string;
  descripcion_ayuda?: string;
  requerido: boolean;
  opciones?: string[] | null;
  validacion?: string | null;
  orden: number;
  tamano_columna: number;
  created_at?: string;
  updated_at?: string;
}

export interface FormularioTemplate {
  id?: number;
  nombre: string;
  descripcion?: string;
  modulos_asignados: number[];
  activo: boolean;
  campos: FormularioCampo[];
  created_at?: string;
  updated_at?: string;
}

export interface FormularioResponse {
  success: boolean;
  formulario?: FormularioTemplate;
  formularios?: FormularioTemplate[];
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FormularioTemplateService {
  private apiUrl = 'http://127.0.0.1:8000/api/formularios';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los formularios (admin)
   */
  getAll(): Observable<FormularioResponse> {
    return this.http.get<FormularioResponse>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener un formulario por ID (admin)
   */
  getById(id: number): Observable<FormularioResponse> {
    return this.http.get<FormularioResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener formulario asignado a un módulo (público)
   */
  getPorModulo(moduloId: number): Observable<FormularioResponse> {
    return this.http.get<FormularioResponse>(`${this.apiUrl}/modulo/${moduloId}`);
  }

  /**
   * Crear un nuevo formulario (admin)
   */
  create(formulario: FormularioTemplate): Observable<FormularioResponse> {
    return this.http.post<FormularioResponse>(this.apiUrl, formulario, {
      headers: this.getHeaders()
    });
  }

  /**
   * Actualizar un formulario existente (admin)
   */
  update(id: number, formulario: Partial<FormularioTemplate>): Observable<FormularioResponse> {
    return this.http.put<FormularioResponse>(`${this.apiUrl}/${id}`, formulario, {
      headers: this.getHeaders()
    });
  }

  /**
   * Eliminar un formulario (admin)
   */
  delete(id: number): Observable<FormularioResponse> {
    return this.http.delete<FormularioResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Duplicar un formulario (admin)
   */
  duplicate(id: number): Observable<FormularioResponse> {
    return this.http.post<FormularioResponse>(`${this.apiUrl}/${id}/duplicate`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener headers con token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Crear un campo vacío con valores por defecto
   */
  crearCampoVacio(orden: number = 0): FormularioCampo {
    return {
      nombre_campo: '',
      etiqueta: '',
      tipo: 'text',
      placeholder: '',
      descripcion_ayuda: '',
      requerido: false,
      opciones: null,
      validacion: null,
      orden: orden,
      tamano_columna: 12
    };
  }

  /**
   * Validar estructura de formulario antes de enviar
   */
  validarFormulario(formulario: FormularioTemplate): string[] {
    const errores: string[] = [];

    if (!formulario.nombre || formulario.nombre.trim() === '') {
      errores.push('El nombre del formulario es requerido');
    }

    if (!formulario.campos || formulario.campos.length === 0) {
      errores.push('El formulario debe tener al menos un campo');
    }

    formulario.campos.forEach((campo, index) => {
      if (!campo.nombre_campo || campo.nombre_campo.trim() === '') {
        errores.push(`Campo ${index + 1}: El nombre del campo es requerido`);
      }

      if (!campo.etiqueta || campo.etiqueta.trim() === '') {
        errores.push(`Campo ${index + 1}: La etiqueta es requerida`);
      }

      if (['select', 'radio'].includes(campo.tipo) && (!campo.opciones || campo.opciones.length === 0)) {
        errores.push(`Campo ${index + 1}: Los campos de tipo ${campo.tipo} requieren opciones`);
      }

      if (campo.tamano_columna < 1 || campo.tamano_columna > 12) {
        errores.push(`Campo ${index + 1}: El tamaño de columna debe estar entre 1 y 12`);
      }
    });

    return errores;
  }

  /**
   * Obtener iconos para cada tipo de campo
   */
  getIconoPorTipo(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'text': '📝',
      'email': '📧',
      'tel': '📱',
      'number': '🔢',
      'date': '📅',
      'select': '📋',
      'textarea': '📄',
      'file': '📎',
      'checkbox': '☑️',
      'radio': '🔘'
    };
    return iconos[tipo] || '❓';
  }

  /**
   * Obtener nombre legible para tipo de campo
   */
  getNombreTipo(tipo: string): string {
    const nombres: { [key: string]: string } = {
      'text': 'Texto',
      'email': 'Correo electrónico',
      'tel': 'Teléfono',
      'number': 'Número',
      'date': 'Fecha',
      'select': 'Selección',
      'textarea': 'Área de texto',
      'file': 'Archivo',
      'checkbox': 'Casilla de verificación',
      'radio': 'Opción múltiple'
    };
    return nombres[tipo] || tipo;
  }
}
