const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || '12345';

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('Authorization Header:', authHeader); // Debug log
  const token = authHeader?.replace('Bearer ', '');
  console.log('Extracted Token:', token); // Debug log

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded Token:', decoded); // Debug log
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;