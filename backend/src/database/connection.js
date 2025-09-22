const mysql = require('mysql2/promise');

let pool = null;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'healthcare_user',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'healthcare_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      charset: 'utf8mb4'
    });
  }
  return pool;
};

const connectDB = async () => {
  try {
    const connection = createPool();
    await connection.execute('SELECT 1');
    console.log('Database connection established');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const getConnection = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  return pool;
};

const closeConnection = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
};

module.exports = {
  connectDB,
  getConnection,
  closeConnection
};