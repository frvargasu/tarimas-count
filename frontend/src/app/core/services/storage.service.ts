import { Injectable } from '@angular/core';
import { Turno, UsuarioInfo } from '../models';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly TOKEN_KEY = 'despacho_token';
  private readonly USER_KEY  = 'despacho_user';
  private readonly TURNO_KEY = 'despacho_turno';

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  setUsuario(usuario: UsuarioInfo): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  getUsuario(): UsuarioInfo | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UsuarioInfo;
    } catch {
      return null;
    }
  }

  removeUsuario(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  setTurnoActivo(turno: Turno): void {
    localStorage.setItem(this.TURNO_KEY, turno);
  }

  getTurnoActivo(): Turno {
    const saved = localStorage.getItem(this.TURNO_KEY);
    if (saved === 'Mañana' || saved === 'Tarde' || saved === 'Noche' || saved === 'Noche Domingo') {
      return saved;
    }
    return this.getUsuario()?.turno_default ?? 'Mañana';
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null && this.getUsuario() !== null;
  }

  clear(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TURNO_KEY);
  }
}
