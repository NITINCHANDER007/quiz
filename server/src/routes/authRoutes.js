const express = require('express');
const jwt = require('jsonwebtoken');
const { verifyAdminToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Validates admin password against environment variable ADMIN_PASSWORD and issues JWT
 */
router.post('/login', (req, res) => {
  const { password } = req.body;
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  if (password !== expectedPassword) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  const token = jwt.sign({ role: 'admin', timestamp: Date.now() }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return res.json({
    success: true,
    message: 'Authentication successful',
    token,
    user: { role: 'admin' },
  });
});

/**
 * GET /api/auth/verify
 * Validates current JWT token for admin session restoration
 */
router.get('/verify', verifyAdminToken, (req, res) => {
  return res.json({
    success: true,
    user: { role: 'admin' },
  });
});

module.exports = router;
