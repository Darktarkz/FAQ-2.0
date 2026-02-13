import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  visible: boolean;
}

interface ApiResponse {
  success: boolean;
  campos?: FormularioCampo[];
  campo?: FormularioCampo;
  template_id?: number;
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FormularioCampoService {
  private apiUrl = 'http://127.0.0.1:8000/api/formulario-campos';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los campos de un módulo
   */
  getPorModulo(moduloId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/modulo/${moduloId}`);
  }

  /**
   * Crear un nuevo campo personalizado
   */
  crear(campo: Partial<FormularioCampo> & { modulo_id: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, campo);
  }

  /**
   * Actualizar un campo existente
   */
  actualizar(id: number, campo: Partial<FormularioCampo>): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, campo);
  }

  /**
   * Eliminar un campo
   */
  eliminar(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Reordenar campos
   */
  reordenar(campos: { id: number; orden: number }[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/reordenar`, { campos });
  }
}
