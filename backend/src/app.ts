import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import registrosRoutes from './routes/registros.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/registros', registrosRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, version: '1.0.0' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada' });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error.message);
  res.status(500).json({ ok: false, error: 'Error interno del servidor' });
});

export default app;
