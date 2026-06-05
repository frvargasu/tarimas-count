export type Turno = 'Mañana' | 'Tarde' | 'Noche' | 'Noche Domingo';
export type Actividad = 'carga' | 'hauler';

export interface LoginRequest {
  username: string;
  pin: string;
}

export interface RegistroRequest {
  username: string;
  pin: string;
  turno_default: Turno;
}

export interface AuthResponse {
  ok: boolean;
  token: string;
  usuario: UsuarioInfo;
}

export interface UsuarioInfo {
  id: number;
  username: string;
  turno_default: Turno;
}
