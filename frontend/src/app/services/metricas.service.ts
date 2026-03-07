import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VotoResponse {
  success: boolean;
  util: number;
  no_util: number;
}

export interface TopPregunta {
  pregunta_id: number;
  pregunta: string;
  total: number;
}

export interface DashboardMetricas {
  tickets: number;
  votos_util: number;
  votos_no_util: number;
  total_votos: number;
  favorabilidad: number | null;
  top_util: TopPregunta[];
  top_no_util: TopPregunta[];
}

@Injectable({ providedIn: 'root' })
export class MetricasService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  votar(preguntaId: number, voto: 'util' | 'no_util'): Observable<VotoResponse> {
    const sessionId = this.getSessionId();
    return this.http.post<VotoResponse>(`${this.apiUrl}/votos`, { pregunta_id: preguntaId, voto }, {
      headers: { 'X-Session-Id': sessionId }
    });
  }

  getVotosPregunta(preguntaId: number): Observable<{ pregunta_id: number; util: number; no_util: number }> {
    return this.http.get<any>(`${this.apiUrl}/votos/${preguntaId}`);
  }

  getDashboard(): Observable<DashboardMetricas> {
    return this.http.get<DashboardMetricas>(`${this.apiUrl}/metricas/dashboard`);
  }

  /** Descarga el CSV de votos con autenticaciÃ³n via HttpClient (envÃ­a Bearer token) */
  downloadCsv(): void {
    this.http.get(`${this.apiUrl}/metricas/exportar-csv`, { responseType: 'blob' }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `votos_preguntas_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    });
  }

  /** Session ID persistente en localStorage */
  private getSessionId(): string {
    let sid = localStorage.getItem('faq_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('faq_session_id', sid);
    }
    return sid;
  }

  getVotoLocal(preguntaId: number): 'util' | 'no_util' | null {
    return localStorage.getItem(`voto_${preguntaId}`) as 'util' | 'no_util' | null;
  }

  setVotoLocal(preguntaId: number, voto: 'util' | 'no_util'): void {
    localStorage.setItem(`voto_${preguntaId}`, voto);
  }
}
