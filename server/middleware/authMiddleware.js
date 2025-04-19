const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        const token = req.cookies.jwt;
        if (!token) {
            console.log('[authMiddleware] No token provided', { url: req.originalUrl });
            return res.status(401).json({ message: 'Пользователь не авторизован (отсутствует токен в куках)' });
        }

        if (!process.env.SECRET_KEY) {
            console.error('[authMiddleware] SECRET_KEY is not defined');
            return res.status(500).json({ message: 'Ошибка конфигурации сервера' });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!decoded.id) {
            console.log('[authMiddleware] Token does not contain user ID', { token });
            return res.status(401).json({ message: 'Токен не содержит ID пользователя' });
        }

        req.user = { userId: decoded.id, roles: decoded.roles || [] };
        console.log('[authMiddleware] Authenticated user:', { userId: req.user.userId, url: req.originalUrl });
        next();
    } catch (error) {
        console.error('[authMiddleware] Error:', error.message, { url: req.originalUrl });
        return res.status(403).json({ message: 'Пользователь не авторизован (недействительный или истёкший токен)' });
    }
};