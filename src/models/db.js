const mysql = require("mysql2/promise");
const dbConfig = require("../config/db.config");

let pool;
let initPromise;

function canSkipDatabaseCreation(error) {
  return [
    "ER_ACCESS_DENIED_ERROR",
    "ER_DBACCESS_DENIED_ERROR",
    "ER_SPECIFIC_ACCESS_DENIED_ERROR",
  ].includes(error?.code);
}

async function init() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let rootConnection;

    try {
      rootConnection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        multipleStatements: true,
      });

    //   await rootConnection.query(
    //     `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``,
    //   );
    } catch (error) {
      if (!canSkipDatabaseCreation(error)) throw error;

      console.warn(
        `Skipping CREATE DATABASE for "${dbConfig.database}" (${error.code}). ` +
          "Use a pre-created database on managed hosts.",
      );
    } finally {
      if (rootConnection) {
        await rootConnection.end().catch(() => {});
      }
    }

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
