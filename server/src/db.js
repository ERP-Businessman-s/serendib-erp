// Database connection pool for Azure SQL, plus a helper that makes sure
// there is always one Admin user to log in with.
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,               // Azure SQL requires encryption
    trustServerCertificate: false,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let poolPromise = null;

// Returns a shared, connected pool. The first call connects; later calls reuse it.
function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config).then((pool) => {
      console.log('Connected to Azure SQL');
      return pool;
    }).catch((err) => {
      poolPromise = null; // let the next call try again
      throw err;
    });
  }
  return poolPromise;
}

// Creates the Admin user if the Users table is empty. Runs once on startup.
async function ensureAdmin() {
  const pool = await getPool();
  const existing = await pool.request().query('SELECT COUNT(*) AS n FROM dbo.Users');
  if (existing.recordset[0].n > 0) return;

  const email = process.env.ADMIN_EMAIL || 'admin@serendib.lk';
  const name = process.env.ADMIN_NAME || 'Serendib Admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(password, 10);

  await pool.request()
    .input('name', sql.NVarChar(100), name)
    .input('email', sql.NVarChar(150), email)
    .input('hash', sql.NVarChar(255), hash)
    .input('role', sql.NVarChar(30), 'Admin')
    .query('INSERT INTO dbo.Users (name, email, password_hash, role) VALUES (@name, @email, @hash, @role)');

  console.log(`Created Admin user: ${email}`);
}

module.exports = { sql, getPool, ensureAdmin };
