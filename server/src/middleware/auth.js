const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_quizmaster_jwt_key_2026!';

/**
 * Express middleware to protect admin HTTP routes
 */
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin role required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

/**
 * Helper to verify JWT token directly (e.g. from Socket.IO handshake or events)
 */
const verifyTokenDirect = (token) => {
  if (!token) return null;
  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    return decoded.role === 'admin' ? decoded : null;
  } catch (err) {
    return null;
  }
};

module.exports = {
  verifyAdminToken,
  verifyTokenDirect,
  JWT_SECRET,
};
