import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { sequelize } from './models';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const ENV = process.env.NODE_ENV ?? 'development';

async function start(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente.');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT} [${ENV}]`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
    process.exit(1);
  }
}

start();
