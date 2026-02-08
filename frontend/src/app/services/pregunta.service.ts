import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pregunta {
  id?: number;
  Idmodulo?: number;
  Aplicativo?: string | null;
  Pregunta: string;
  Respuesta: string;
  Modulo?: string;
  Submodulo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PreguntaService {
  private apiUrl = 'http://localhost:8000/api/preguntas';

  constructor(private http: HttpClient) {}

  // Obtener todas las preguntas (público)
  getPreguntas(): Observable<Pregunta[]> {
    return this.http.get<Pregunta[]>(this.apiUrl);
  }

  // Obtener una pregunta por ID (público)
  getPregunta(id: number): Observable<Pregunta> {
    return this.http.get<Pregunta>(`${this.apiUrl}/${id}`);
  }

  // Obtener preguntas por módulo (público)
  getPreguntasPorModulo(moduloId: number): Observable<Pregunta[]> {
    return this.http.get<Pregunta[]>(`${this.apiUrl}/modulo/${moduloId}`);
  }

  // Buscar preguntas (público)
  searchPreguntas(term: string): Observable<Pregunta[]> {
    return this.http.get<Pregunta[]>(`${this.apiUrl}/search?q=${term}`);
  }

  // Subir imagen (admin, portapapeles/editor)
  uploadImagen(archivo: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('imagen', archivo);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-image`, formData);
  }

  // Crear pregunta (protegido)
  createPregunta(pregunta: Pregunta): Observable<any> {
    return this.http.post<any>(this.apiUrl, pregunta);
  }

  // Actualizar pregunta (protegido)
  updatePregunta(id: number, pregunta: Pregunta): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, pregunta);
  }

  // Eliminar pregunta (protegido)
  deletePregunta(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Obtener información de debug
  getDebugInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/debug`);
  }

  // Limpiar números del inicio de las preguntas
  limpiarNumeros(dryRun: boolean = true): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/limpiar-numeros`, { dry_run: dryRun });
  }
}
