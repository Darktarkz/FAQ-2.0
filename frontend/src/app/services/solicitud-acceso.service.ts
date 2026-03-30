import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SolicitudAccesoResponse } from '../models/solicitud-acceso.model';

@Injectable({
  providedIn: 'root'
})
export class SolicitudAccesoService {
  private apiUrl = `${environment.apiUrl}/solicitudes-acceso`;

  constructor(private http: HttpClient) {}

  crear(formData: FormData): Observable<SolicitudAccesoResponse> {
    return this.http.post<SolicitudAccesoResponse>(this.apiUrl, formData);
  }
}
