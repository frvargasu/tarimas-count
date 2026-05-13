import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import {
  LoginRequest,
  RegistroRequest,
  AuthResponse,
  Turno,
  RegistroPayload,
  RespuestaHoy,
  ResumenDia,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http    = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly base    = environment.apiUrl;

  private headers(): HttpHeaders {
    const token = this.storage.getToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { headers: this.headers() });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', data);
  }

  registro(data: RegistroRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/registro', data);
  }

  crearRegistro(payload: RegistroPayload): Observable<{ ok: boolean; registro: RegistroPayload }> {
    return this.post<{ ok: boolean; registro: RegistroPayload }>('/registros', payload);
  }

  obtenerHoy(fecha: string, turno: Turno): Observable<RespuestaHoy> {
    return this.get<RespuestaHoy>(`/registros/hoy?fecha=${fecha}&turno=${encodeURIComponent(turno)}`);
  }

  obtenerSemana(): Observable<{ ok: boolean; resumen: ResumenDia[] }> {
    return this.get<{ ok: boolean; resumen: ResumenDia[] }>('/registros/semana');
  }

  sincronizarLote(
    registros: RegistroPayload[]
  ): Observable<{ ok: boolean; insertados: number; duplicados: number; errores: number }> {
    return this.post<{ ok: boolean; insertados: number; duplicados: number; errores: number }>(
      '/registros/sync',
      { registros }
    );
  }
}
