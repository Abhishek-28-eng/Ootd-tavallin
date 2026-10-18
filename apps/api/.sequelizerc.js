require('dotenv').config();

const isTest = process.env.NODE_ENV === 'test';

module.exports = {
  development: {
    username: process.env.DB_USER || 'tavallin',
    password: process.env.DB_PASSWORD || 'tavallin_secret',
    database: process.env.DB_NAME || 'tavallin_dev',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    charset: 'utf8mb4',
    dialectOptions: {
      charset: 'utf8mb4',
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  },
  test: {
    username: process.env.TEST_DB_USER || 'tavallin',
    password: process.env.TEST_DB_PASSWORD || 'tavallin_secret',
    database: process.env.TEST_DB_NAME || 'tavallin_test',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '3306'),
    dialect: 'mysql',
    charset: 'utf8mb4',
    dialectOptions: {
      charset: 'utf8mb4',
    },
    define: {
      underscored: true,
      timestamps: true,
    },
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    charset: 'utf8mb4',
    dialectOptions: {
      charset: 'utf8mb4',
      ...(process.env.DB_SSL === 'true'
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
            },
          }
        : {}),
    },
    define: {
      underscored: true,
      timestamps: true,
    },
    logging: false,
    pool: {
      min: 2,
      max: 10,
      acquire: 30000,
      idle: 10000,
    },
  },
};
