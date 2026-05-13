import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  crearRegistro,
  obtenerHoy,
  obtenerSemana,
  sincronizarLote,
} from '../controllers/registros.controller';

const router = Router();

router.post('/', authMiddleware, crearRegistro);
router.get('/hoy', authMiddleware, obtenerHoy);
router.get('/semana', authMiddleware, obtenerSemana);
router.post('/sync', authMiddleware, sincronizarLote);

export default router;
