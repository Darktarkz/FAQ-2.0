import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchItem {
  id: number;
  nombre?: string;
  titulo?: string;
  descripcion?: string;
  modulo_id?: number;
  modulo_nombre?: string;
}

export interface SearchResults {
  modulos: SearchItem[];
  preguntas: SearchItem[];
  categorias: SearchItem[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  search(q: string): Observable<SearchResults> {
    return this.http.get<SearchResults>(`${this.apiUrl}/admin/search`, {
      params: { q }
    });
  }
}
