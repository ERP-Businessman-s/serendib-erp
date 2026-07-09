// Password hashing, token signing, and the middleware that protects the API.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(user) {
  // Only put safe, small fields in the token. Never the password hash.
  return jwt.sign(
    { id: user.user_id, name: user.name, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '8h' }
  );
}

// Blocks any request that does not carry a valid "Authorization: Bearer <token>".
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

module.exports = { hashPassword, comparePassword, signToken, authRequired };
