import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { crearRegistroCarro, listarRegistrosCarro } from '../controllers/registro-carro.controller';

const router = Router();

router.get('/', authMiddleware, listarRegistrosCarro);
router.post('/', authMiddleware, crearRegistroCarro);

export default router;
