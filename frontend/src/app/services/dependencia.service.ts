import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Dependencia, DependenciasResponse } from '../models/solicitud-acceso.model';

@Injectable({
  providedIn: 'root'
})
export class DependenciaService {
  private apiUrl = `${environment.apiUrl}/dependencias`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<DependenciasResponse> {
    return this.http.get<DependenciasResponse>(this.apiUrl);
  }
}
