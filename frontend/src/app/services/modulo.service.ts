import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Modulo {
  id?: number;
  nombre: string;
  descripcion?: string;
  id_categoria?: number;
  idpadre?: number | null;
  icono?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ModuloService {
  private apiUrl = 'http://localhost:8000/api/modulos';

  constructor(private http: HttpClient) {}

  // Obtener todos los módulos
  getModulos(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(this.apiUrl);
  }

  // Obtener un módulo por ID
  getModulo(id: number): Observable<Modulo> {
    return this.http.get<Modulo>(`${this.apiUrl}/${id}`);
  }

  // Obtener módulos por categoría
  getModulosPorCategoria(categoriaId: number): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`http://localhost:8000/api/categorias/${categoriaId}/modulos`);
  }

  // Crear módulo
  createModulo(modulo: Modulo): Observable<any> {
    return this.http.post<any>(this.apiUrl, modulo);
  }

  // Actualizar módulo
  updateModulo(id: number, modulo: Modulo): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, modulo);
  }

  // Eliminar módulo
  deleteModulo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
