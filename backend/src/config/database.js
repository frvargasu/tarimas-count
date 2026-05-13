require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'despacho_db',
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306'),
    dialect:  'mysql',
    logging:  false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql',
    dialectOptions: {
      ssl: { rejectUnauthorized: false }
    },
    logging: false
  }
};
