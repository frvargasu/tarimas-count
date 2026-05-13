import { Request, Response } from 'express';
import { Usuario } from '../models';
import { generarToken } from '../utils/jwt';
import { esUsernameValido, esPinValido, esTurnoValido } from '../utils/validaciones';

export async function registrar(req: Request, res: Response): Promise<void> {
  try {
    const { username, pin, turno_default } = req.body as {
      username: unknown;
      pin: unknown;
      turno_default: unknown;
    };

    if (typeof username !== 'string' || !esUsernameValido(username)) {
      res.status(400).json({
        ok: false,
        error: 'Username inválido. Usa 3–30 caracteres: letras, números, guiones, puntos o underscore. Sin espacios.',
      });
      return;
    }

    if (typeof pin !== 'string' || !esPinValido(pin)) {
      res.status(400).json({
        ok: false,
        error: 'El PIN debe ser exactamente 4 dígitos numéricos.',
      });
      return;
    }

    if (typeof turno_default !== 'string' || !esTurnoValido(turno_default)) {
      res.status(400).json({
        ok: false,
        error: 'turno_default debe ser Mañana, Tarde, Noche o Noche Domingo.',
      });
      return;
    }

    const existe = await Usuario.findOne({ where: { username } });
    if (existe) {
      res.status(409).json({ ok: false, error: 'Este nombre ya está en uso' });
      return;
    }

    const usuario = await Usuario.create({ username, pin, turno_default });

    const token = generarToken({ id: usuario.id, username: usuario.username });

    res.status(201).json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        turno_default: usuario.turno_default,
      },
    });
  } catch {
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, pin } = req.body as { username: unknown; pin: unknown };

    if (typeof username !== 'string' || typeof pin !== 'string') {
      res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
      return;
    }

    const usuario = await Usuario.findOne({ where: { username, activo: true } });

    // Respuesta idéntica si no existe el usuario o si el pin es incorrecto
    if (!usuario || !(await usuario.validarPin(pin))) {
      res.status(401).json({ ok: false, error: 'Credenciales inválidas' });
      return;
    }

    const token = generarToken({ id: usuario.id, username: usuario.username });

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        turno_default: usuario.turno_default,
      },
    });
  } catch {
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
}
