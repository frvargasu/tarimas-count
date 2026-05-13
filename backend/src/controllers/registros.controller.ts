import { Response, NextFunction } from 'express';
import { RequestConUsuario as Request } from '../middleware/auth.middleware';
import { Op } from 'sequelize';
import { Registro, SyncQueue, sequelize } from '../models';
import { Turno, Actividad, RegistroAttributes, RegistroPayload } from '../types/models';
import { esTurnoValido } from '../utils/validaciones';
import { calcularMetricas, METAS } from '../services/metricas.service';

const ACTIVIDADES: readonly Actividad[] = ['carga', 'hauler'];
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function esFechaValida(fecha: string): boolean {
  if (!FECHA_REGEX.test(fecha)) return false;
  const d = new Date(fecha + 'T00:00:00');
  return !isNaN(d.getTime());
}

function esFechaFutura(fecha: string): boolean {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  return new Date(fecha + 'T00:00:00') > hoy;
}

function esPayloadValido(item: unknown): item is RegistroPayload {
  if (typeof item !== 'object' || item === null) return false;
  const p = item as Record<string, unknown>;
  return (
    typeof p.uuid === 'string' &&
    typeof p.fecha === 'string' &&
    typeof p.turno === 'string' &&
    typeof p.actividad === 'string' &&
    typeof p.tarimas === 'number' &&
    typeof p.hora === 'string'
  );
}

async function uuidExiste(usuarioId: number, uuid: string): Promise<boolean> {
  const encontrado = await SyncQueue.findOne({
    where: {
      usuario_id: usuarioId,
      [Op.and]: [
        sequelize.literal(
          `JSON_EXTRACT(payload, '$.uuid') = ${sequelize.escape(uuid)}`
        ),
      ],
    },
  });
  return encontrado !== null;
}

export async function crearRegistro(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usuarioId = req.usuario!.id;
    const body = req.body as Record<string, unknown>;
    const { fecha, turno, actividad, tarimas, hora, uuid } = body;

    if (typeof fecha !== 'string' || !esFechaValida(fecha)) {
      res.status(400).json({ ok: false, error: 'fecha inválida, use YYYY-MM-DD' });
      return;
    }
    if (esFechaFutura(fecha)) {
      res.status(400).json({ ok: false, error: 'la fecha no puede ser futura' });
      return;
    }
    if (typeof turno !== 'string' || !esTurnoValido(turno)) {
      res.status(400).json({ ok: false, error: "turno debe ser 'AM-PM', 'NOCHE' o 'DOMINGO'" });
      return;
    }
    if (typeof actividad !== 'string' || !(ACTIVIDADES as readonly string[]).includes(actividad)) {
      res.status(400).json({ ok: false, error: "actividad debe ser 'carga' o 'hauler'" });
      return;
    }
    if (
      typeof tarimas !== 'number' ||
      !Number.isInteger(tarimas) ||
      tarimas < 1 ||
      tarimas > 500
    ) {
      res.status(400).json({ ok: false, error: 'tarimas debe ser un entero entre 1 y 500' });
      return;
    }
    if (typeof hora !== 'string' || isNaN(new Date(hora).getTime())) {
      res.status(400).json({ ok: false, error: 'hora debe ser un ISO string válido' });
      return;
    }
    if (typeof uuid !== 'string' || uuid.trim() === '') {
      res.status(400).json({ ok: false, error: 'uuid es requerido' });
      return;
    }

    if (await uuidExiste(usuarioId, uuid)) {
      res.status(409).json({ ok: false, error: 'registro duplicado' });
      return;
    }

    const payload: RegistroPayload = {
      uuid,
      fecha,
      turno: turno as Turno,
      actividad: actividad as Actividad,
      tarimas,
      hora,
    };

    const registro = await sequelize.transaction(async (t) => {
      const reg = await Registro.create(
        {
          usuario_id: usuarioId,
          fecha,
          turno: turno as Turno,
          actividad: actividad as Actividad,
          tarimas,
          hora: new Date(hora),
          sincronizado: true,
        },
        { transaction: t }
      );
      await SyncQueue.create(
        { usuario_id: usuarioId, payload, intentos: 1, sincronizado: true, synced_at: new Date() },
        { transaction: t }
      );
      return reg;
    });

    res.status(201).json({ ok: true, registro: registro.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

export async function obtenerHoy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usuarioId = req.usuario!.id;
    const { fecha, turno } = req.query as Record<string, string | undefined>;

    if (!fecha || !esFechaValida(fecha)) {
      res.status(400).json({ ok: false, error: 'fecha inválida, use YYYY-MM-DD' });
      return;
    }
    if (!turno || !esTurnoValido(turno)) {
      res.status(400).json({ ok: false, error: "turno debe ser 'AM-PM', 'NOCHE' o 'DOMINGO'" });
      return;
    }

    const registros = await Registro.findAll({
      where: { usuario_id: usuarioId, fecha, turno },
      order: [['hora', 'ASC']],
    });

    const attrs: RegistroAttributes[] = registros.map((r) => r.get({ plain: true }));
    const horaActual = new Date();

    const metricas = {
      carga: calcularMetricas(attrs, 'carga', turno as Turno, horaActual),
      hauler: calcularMetricas(attrs, 'hauler', turno as Turno, horaActual),
    };

    res.json({ ok: true, registros: attrs, metricas });
  } catch (err) {
    next(err);
  }
}

export async function obtenerSemana(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usuarioId = req.usuario!.id;

    const hoy = new Date();
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 6);

    const fechaDesde = localDateStr(desde);
    const fechaHasta = localDateStr(hoy);

    const registros = await Registro.findAll({
      where: {
        usuario_id: usuarioId,
        fecha: { [Op.between]: [fechaDesde, fechaHasta] },
      },
      order: [
        ['fecha', 'ASC'],
        ['hora', 'ASC'],
      ],
    });

    const attrs: RegistroAttributes[] = registros.map((r) => r.get({ plain: true }));

    const porFecha = new Map<string, RegistroAttributes[]>();
    for (const r of attrs) {
      const lista = porFecha.get(r.fecha) ?? [];
      lista.push(r);
      porFecha.set(r.fecha, lista);
    }

    const resumen = Array.from(porFecha.entries()).map(([fecha, regs]) => {
      const turno = regs[0].turno;
      const totalCarga = regs
        .filter((r) => r.actividad === 'carga')
        .reduce((s, r) => s + r.tarimas, 0);
      const totalHauler = regs
        .filter((r) => r.actividad === 'hauler')
        .reduce((s, r) => s + r.tarimas, 0);

      return {
        fecha,
        turno,
        totalCarga,
        totalHauler,
        cumpleCarga: totalCarga >= METAS[turno].carga,
        cumpleHauler: totalHauler >= METAS[turno].hauler,
      };
    });

    res.json({ ok: true, resumen });
  } catch (err) {
    next(err);
  }
}

export async function sincronizarLote(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usuarioId = req.usuario!.id;
    const body = req.body as { registros?: unknown };

    if (!Array.isArray(body.registros) || body.registros.length === 0) {
      res.status(400).json({ ok: false, error: 'registros debe ser un array no vacío' });
      return;
    }

    let insertados = 0;
    let duplicados = 0;
    let errores = 0;

    for (const item of body.registros) {
      try {
        if (!esPayloadValido(item)) {
          errores++;
          continue;
        }

        const { uuid, fecha, turno, actividad, tarimas, hora } = item;

        if (!esTurnoValido(turno) || !(ACTIVIDADES as readonly string[]).includes(actividad)) {
          errores++;
          continue;
        }

        if (await uuidExiste(usuarioId, uuid)) {
          duplicados++;
          continue;
        }

        await sequelize.transaction(async (t) => {
          await Registro.create(
            { usuario_id: usuarioId, fecha, turno, actividad, tarimas, hora: new Date(hora), sincronizado: true },
            { transaction: t }
          );
          await SyncQueue.create(
            { usuario_id: usuarioId, payload: item, intentos: 1, sincronizado: true, synced_at: new Date() },
            { transaction: t }
          );
        });

        insertados++;
      } catch {
        errores++;
      }
    }

    res.json({ ok: true, insertados, duplicados, errores });
  } catch (err) {
    next(err);
  }
}
