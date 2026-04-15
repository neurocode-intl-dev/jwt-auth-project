const mysql = require("mysql2/promise");
const dbConfig = require("../config/db.config");

let pool;
let initPromise;

async function init() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const rootConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
    });

    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``,
    );
    await rootConnection.end();

    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: dbConfig.connectionLimit,
      queueLimit: 0,
    });

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return pool;
  })();

  return initPromise;
}

function getPool() {
  if (!pool) {
    throw new Error(
      "Database has not been initialized. Call init() before using models.",
    );
  }
  return pool;
}

module.exports = { init, getPool };
