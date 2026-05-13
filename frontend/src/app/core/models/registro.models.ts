import { Turno, Actividad } from './auth.models';

export type { Turno, Actividad };

export const HORARIOS_TURNO: Record<Turno, {
  conexion: string;
  desconexion: string;
  duracionProductiva: number;
  breakInicio: string;
  breakFin: string;
}> = {
  'Mañana': {
    conexion: '06:35', desconexion: '14:18',
    duracionProductiva: 7.22,
    breakInicio: '10:30', breakFin: '11:00',
  },
  'Tarde': {
    conexion: '14:20', desconexion: '22:03',
    duracionProductiva: 7.22,
    breakInicio: '17:00', breakFin: '17:30',
  },
  'Noche': {
    conexion: '22:05', desconexion: '06:10',
    duracionProductiva: 7.58,
    breakInicio: '02:30', breakFin: '03:00',
  },
  'Noche Domingo': {
    conexion: '00:20', desconexion: '06:10',
    duracionProductiva: 5.33,
    breakInicio: '02:30', breakFin: '03:00',
  },
};

export const METAS: Record<Turno, Record<Actividad, number>> = {
  'Mañana':        { carga: 135, hauler: 187 },
  'Tarde':         { carga: 135, hauler: 187 },
  'Noche':         { carga: 141, hauler: 197 },
  'Noche Domingo': { carga: 102, hauler: 142 },
};

export interface RegistroPayload {
  uuid: string;
  fecha: string;
  turno: Turno;
  actividad: Actividad;
  tarimas: number;
  hora: string;
}

export interface RegistroLocal extends RegistroPayload {
  id?: number;
  sincronizado: boolean;
  usuario_id: number;
}

export interface MetricasActividad {
  actividad: Actividad;
  totalActual: number;
  meta: number;
  porcentaje: number;
  tarimasXHora: number;
  ritmoRequerido: number;
  proyeccion: number;
  cumple: boolean;
  estado: 'cumplido' | 'en meta' | 'bajo meta';
}

export interface RespuestaHoy {
  ok: boolean;
  registros: RegistroPayload[];
  metricas: {
    carga: MetricasActividad;
    hauler: MetricasActividad;
  };
}

export interface ResumenDia {
  fecha: string;
  turno: Turno;
  totalCarga: number;
  totalHauler: number;
  cumpleCarga: boolean;
  cumpleHauler: boolean;
}
