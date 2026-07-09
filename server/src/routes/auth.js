// Login and "who am I" endpoints.
const express = require('express');
const { sql, getPool } = require('../db');
const { comparePassword, signToken, authRequired } = require('../auth');

const router = express.Router();

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .query('SELECT user_id, name, email, password_hash, role FROM dbo.Users WHERE email = @email');

    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: 'Wrong email or password' });

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Wrong email or password' });

    const token = signToken(user);
    res.json({ token, user: { id: user.user_id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me  -> the logged in user, from the token
router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
