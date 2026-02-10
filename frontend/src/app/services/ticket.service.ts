import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ticket {
  id?: number;
  numero_ticket?: string;
  modulo_id: number;
  nombre_completo: string;
  tipo_identificacion?: string;
  cedula?: string;
  correo: string;
  telefono?: string;
  numero_contrato?: string;
  descripcion: string;
  screenshot_path?: string;
  estado?: 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado';
  prioridad?: 'baja' | 'media' | 'alta';
  created_at?: string;
  updated_at?: string;
  modulo?: any;
}

export interface TicketResponse {
  success: boolean;
  message?: string;
  ticket?: Ticket;
  tickets?: Ticket[];
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'http://127.0.0.1:8000/api/tickets';

  constructor(private http: HttpClient) {}

  /**
   * Crear un nuevo ticket de soporte (público - sin autenticación)
   */
  crearTicket(ticketData: FormData): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(this.apiUrl, ticketData);
  }

  /**
   * Listar todos los tickets (requiere autenticación - solo admin)
   */
  listarTickets(filtros?: { modulo_id?: number; estado?: string }): Observable<TicketResponse> {
    let url = this.apiUrl;
    const params: string[] = [];

    if (filtros?.modulo_id) {
      params.push(`modulo_id=${filtros.modulo_id}`);
    }
    if (filtros?.estado) {
      params.push(`estado=${filtros.estado}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<TicketResponse>(url);
  }

  /**
   * Ver detalle de un ticket (requiere autenticación - solo admin)
   */
  verTicket(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualizar estado del ticket (requiere autenticación - solo admin)
   */
  actualizarEstado(id: number, estado: string): Observable<TicketResponse> {
    return this.http.put<TicketResponse>(`${this.apiUrl}/${id}/estado`, { estado });
  }
}
