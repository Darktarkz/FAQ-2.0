import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FormularioConfig {
  modulo_id: number;
  mostrar_tipo_identificacion: boolean;
  mostrar_cedula: boolean;
  mostrar_telefono: boolean;
  mostrar_numero_contrato: boolean;
  mostrar_screenshot: boolean;
}

interface ApiResponse {
  success: boolean;
  config?: FormularioConfig;
  configuraciones?: any[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormularioConfigService {
  private apiUrl = 'http://127.0.0.1:8000/api/formulario-config';

  constructor(private http: HttpClient) {}

  getPorModulo(moduloId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/modulo/${moduloId}`);
  }

  listarTodos(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl);
  }

  guardar(config: Partial<FormularioConfig>): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, config);
  }

  restablecer(moduloId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${moduloId}`);
  }
}
