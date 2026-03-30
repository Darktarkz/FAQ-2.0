import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FormularioCampo {
  id?: number;
  formulario_template_id?: number;
  nombre_campo: string;
  etiqueta: string;
  tipo: 'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio';
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
  origen_modulo_id?: number;
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FormularioCampoService {
  private apiUrl = `${environment.apiUrl}/formulario-campos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener campos de un módulo, con fallback pregunta → módulo.
   * @param preguntaId si se proporciona, el backend busca primero el template exclusivo de esa pregunta
   */
  getPorModulo(moduloId: number, incluirOcultos: boolean = false, preguntaId?: number): Observable<ApiResponse> {
    const params = new URLSearchParams();
    if (incluirOcultos) params.set('incluir_ocultos', '1');
    if (preguntaId) params.set('pregunta_id', String(preguntaId));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.http.get<ApiResponse>(`${this.apiUrl}/modulo/${moduloId}${qs}`);
  }

  /**
   * Obtener campos exclusivos de una pregunta (sin fallback, para el panel admin).
   */
  getPorPregunta(preguntaId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/pregunta/${preguntaId}`);
  }

  /**
   * Crear un nuevo campo personalizado.
   * Requiere modulo_id O pregunta_id.
   */
  crear(campo: Partial<FormularioCampo> & { modulo_id?: number; pregunta_id?: number }): Observable<ApiResponse> {
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
