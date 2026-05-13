import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { initUsuario } from './Usuario';
import { initRegistro } from './Registro';
import { initSyncQueue } from './SyncQueue';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: { rejectUnauthorized: false }
      },
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(
      process.env.DB_NAME     || 'despacho_db',
      process.env.DB_USER     || 'root',
      process.env.DB_PASSWORD || '',
      {
        host:    process.env.DB_HOST || 'localhost',
        port:    parseInt(process.env.DB_PORT || '3306', 10),
        dialect: 'mysql',
        logging: isProduction ? false : console.log,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      }
    );

export const Usuario = initUsuario(sequelize);
export const Registro = initRegistro(sequelize);
export const SyncQueue = initSyncQueue(sequelize);

Usuario.hasMany(Registro, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Registro.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(SyncQueue, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
SyncQueue.belongsTo(Usuario, { foreignKey: 'usuario_id' });

export default sequelize;