const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    if (req.method === 'OPTIONS') {
        return next(); // Пропускаем предварительные запросы CORS
    }

    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: 'User not authorized (no token in cookies)' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!decoded.id) {
            return res.status(401).json({ message: 'Token does not contain user ID' });
        }

        req.user = { userId: decoded.id, roles: decoded.roles || [] };
        console.log('Authenticated user:', req.user);
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(403).json({ message: 'User not authorized (invalid or expired token)' });
    }
};