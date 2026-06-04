import { Response, NextFunction } from 'express';
import { RequestConUsuario as Request } from '../middleware/auth.middleware';
import { RegistroCarro } from '../models';

const FASES_VALIDAS = [1, 2] as const;
const CAPACIDADES_VALIDAS = [14, 16, 18, 28, 30] as const;
const NUM_LOCALES_VALIDOS = [1, 2, 3, 4, 5, 6] as const;

export async function crearRegistroCarro(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as Record<string, unknown>;
    const { fase, anden, capacidad_carro, num_locales, comentario } = body;

    if (typeof fase !== 'number' || !Number.isInteger(fase) || !(FASES_VALIDAS as readonly number[]).includes(fase)) {
      res.status(400).json({ ok: false, error: 'fase debe ser 1 o 2' });
      return;
    }
    if (typeof anden !== 'number' || !Number.isInteger(anden) || anden < 1) {
      res.status(400).json({ ok: false, error: 'anden debe ser un entero positivo' });
      return;
    }
    if (typeof capacidad_carro !== 'number' || !(CAPACIDADES_VALIDAS as readonly number[]).includes(capacidad_carro)) {
      res.status(400).json({ ok: false, error: 'capacidad_carro debe ser 14, 16, 18, 28 o 30' });
      return;
    }
    if (typeof num_locales !== 'number' || !Number.isInteger(num_locales) || !(NUM_LOCALES_VALIDOS as readonly number[]).includes(num_locales)) {
      res.status(400).json({ ok: false, error: 'num_locales debe ser entre 1 y 6' });
      return;
    }
    if (comentario !== undefined && comentario !== null && typeof comentario !== 'string') {
      res.status(400).json({ ok: false, error: 'comentario debe ser texto' });
      return;
    }

    const registro = await RegistroCarro.create({
      fase,
      anden,
      capacidad_carro,
      num_locales,
      comentario: typeof comentario === 'string' && comentario.trim() ? comentario.trim() : null,
    });

    res.status(201).json({ ok: true, registro: registro.get({ plain: true }) });
  } catch (err) {
    next(err);
  }
}

export async function listarRegistrosCarro(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const registros = await RegistroCarro.findAll({
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    res.json({ ok: true, registros: registros.map((r) => r.get({ plain: true })) });
  } catch (err) {
    next(err);
  }
}
