import { Dialect } from 'sequelize';
import * as dotenv from 'dotenv';
dotenv.config();

interface DbConfig {
  username: string;
  password: string;
  database: string;
  host: string;
  port: number;
  dialect: Dialect;
  logging: boolean;
}

export const dbConfig: DbConfig = {
  username: process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'despacho_db',
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  dialect:  'mysql',
  logging:  false
};
