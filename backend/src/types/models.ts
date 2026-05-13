export type Turno = 'Mañana' | 'Tarde' | 'Noche' | 'Noche Domingo';
export type Actividad = 'carga' | 'hauler';

export interface UsuarioAttributes {
  id?: number;
  username: string;
  pin: string;
  turno_default: Turno;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface RegistroAttributes {
  id?: number;
  usuario_id: number;
  fecha: string;
  turno: Turno;
  actividad: Actividad;
  tarimas: number;
  hora: Date;
  sincronizado: boolean;
  created_at?: Date;
}

export interface SyncQueueAttributes {
  id?: number;
  usuario_id: number;
  payload: RegistroPayload;
  intentos: number;
  sincronizado: boolean;
  created_at?: Date;
  synced_at?: Date | null;
}

export interface RegistroPayload {
  uuid: string;
  fecha: string;
  turno: Turno;
  actividad: Actividad;
  tarimas: number;
  hora: string;
}
