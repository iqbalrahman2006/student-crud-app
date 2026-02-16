-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- NODE.JS ↔ MYSQL CONNECTIVITY EXAMPLES (Using mysql2 and Sequelize)
-- ==================================================================================

-- Example 1: mysql2 (Promise) simple connection

const mysql = require('mysql2/promise');

async function testConnection() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'studentdb'
  });
  const [rows] = await conn.execute('SELECT COUNT(*) as cnt FROM Students');
  console.log(rows);
  await conn.end();
}

-- Run with Node.js: `node connectivity/test_mysql2.js`

-- Example 2: Sequelize basic setup (used by project)

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('studentdb', 'root', 'your_password', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
});

async function testSequelize() {
  try {
    await sequelize.authenticate();
    console.log('Sequelize: Connection has been established successfully.');
  } catch (error) {
    console.error('Sequelize: Unable to connect to the database:', error);
  }
}

-- Example 3: Using environment variables in Windows PowerShell (recommended for tests)
-- PowerShell commands:
-- $env:DB_ENGINE='mysql'; $env:NODE_ENV='development'; Push-Location d:\DBMS\studentDB\student-crud-app-1\server; npm test -- --runInBand; Pop-Location

-- Example 4: Health-check endpoint verification (from project)
-- curl http://localhost:5000/api/v1/health

-- Notes:
-- - Never commit plaintext passwords. Use `.env` or platform secrets.
-- - For tests use a dedicated test database or transaction rollback pattern.
-- - The project's `server/src/config` reads DB_ENGINE and selects Sequelize for MySQL.

-- End of connectivity examples
