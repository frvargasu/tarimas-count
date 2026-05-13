import { RegistroAttributes, Turno, Actividad } from '../types/models';

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

export const METAS: Record<Turno, Record<Actividad, number>> = {
  'Mañana':        { carga: 135, hauler: 187 },
  'Tarde':         { carga: 135, hauler: 187 },
  'Noche':         { carga: 141, hauler: 197 },
  'Noche Domingo': { carga: 102, hauler: 142 },
};

// Duración productiva en horas (turno completo menos break de 30 min)
const DURACION_TURNO: Record<Turno, number> = {
  'Mañana':        7.22,
  'Tarde':         7.22,
  'Noche':         7.58,
  'Noche Domingo': 5.33,
};

export const HORARIOS_TURNO: Record<Turno, { conexion: string; desconexion: string }> = {
  'Mañana':        { conexion: '06:35', desconexion: '14:18' },
  'Tarde':         { conexion: '14:20', desconexion: '22:03' },
  'Noche':         { conexion: '22:05', desconexion: '06:10' },
  'Noche Domingo': { conexion: '00:20', desconexion: '06:10' },
};

export function calcularMetricas(
  registros: RegistroAttributes[],
  actividad: Actividad,
  turno: Turno,
  horaActual: Date
): MetricasActividad {
  const filtrados = registros.filter((r) => r.actividad === actividad);
  const meta = METAS[turno][actividad];
  const duracionTurno = DURACION_TURNO[turno];
  const totalActual = filtrados.reduce((sum, r) => sum + r.tarimas, 0);

  let horasTranscurridas = 0;
  if (filtrados.length > 0) {
    const primerTimestamp = filtrados.reduce(
      (min, r) => Math.min(min, new Date(r.hora).getTime()),
      Infinity
    );
    horasTranscurridas = Math.max(
      0,
      (horaActual.getTime() - primerTimestamp) / 3_600_000
    );
  }

  const tarimasXHora =
    horasTranscurridas > 0
      ? Math.round((totalActual / horasTranscurridas) * 10) / 10
      : 0;

  const horasRestantes = Math.max(0, duracionTurno - horasTranscurridas);
  const proyeccion = totalActual + tarimasXHora * horasRestantes;

  const ritmoRequerido =
    horasRestantes > 0
      ? Math.round(((meta - totalActual) / horasRestantes) * 10) / 10
      : 0;

  const porcentaje = Math.min(100, Math.round((totalActual / meta) * 100));
  const cumple = proyeccion >= meta || totalActual >= meta;

  let estado: 'cumplido' | 'en meta' | 'bajo meta';
  if (totalActual >= meta) {
    estado = 'cumplido';
  } else if (cumple) {
    estado = 'en meta';
  } else {
    estado = 'bajo meta';
  }

  return {
    actividad,
    totalActual,
    meta,
    porcentaje,
    tarimasXHora,
    ritmoRequerido,
    proyeccion: Math.round(proyeccion * 10) / 10,
    cumple,
    estado,
  };
}
