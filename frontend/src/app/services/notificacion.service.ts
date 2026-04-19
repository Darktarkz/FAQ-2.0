import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Notificacion {
  id: number;
  tipo: 'voto_util' | 'voto_no_util';
  pregunta_id: number;
  modulo_id: number;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  total_no_leidas: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService implements OnDestroy {
  private apiUrl = environment.apiUrl;

  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  private totalNoLeidasSubject  = new BehaviorSubject<number>(0);

  notificaciones$  = this.notificacionesSubject.asObservable();
  totalNoLeidas$   = this.totalNoLeidasSubject.asObservable();

  private pollingSub?: Subscription;

  constructor(private http: HttpClient) {}

  /** Carga inicial + inicia polling cada 30 segundos. */
  startPolling(): void {
    this.loadNotificaciones();
    this.pollingSub = interval(30_000).pipe(
      switchMap(() => this.http.get<NotificacionesResponse>(`${this.apiUrl}/notificaciones`))
    ).subscribe(res => this.handleResponse(res));
  }

  stopPolling(): void {
    this.pollingSub?.unsubscribe();
  }

  loadNotificaciones(): void {
    this.http.get<NotificacionesResponse>(`${this.apiUrl}/notificaciones`).subscribe(
      res => this.handleResponse(res)
    );
  }

  marcarLeida(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notificaciones/${id}/leer`, {}).pipe(
      tap(() => {
        const current = this.notificacionesSubject.value;
        const updated = current.map(n => n.id === id ? { ...n, leida: true } : n);
        this.notificacionesSubject.next(updated);
        const noLeidas = updated.filter(n => !n.leida).length;
        this.totalNoLeidasSubject.next(noLeidas);
      })
    );
  }

  marcarTodasLeidas(): Observable<any> {
    return this.http.put(`${this.apiUrl}/notificaciones/leer-todas`, {}).pipe(
      tap(() => {
        const current = this.notificacionesSubject.value;
        this.notificacionesSubject.next(current.map(n => ({ ...n, leida: true })));
        this.totalNoLeidasSubject.next(0);
      })
    );
  }

  private handleResponse(res: NotificacionesResponse): void {
    this.notificacionesSubject.next(res.notificaciones ?? []);
    this.totalNoLeidasSubject.next(res.total_no_leidas ?? 0);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
