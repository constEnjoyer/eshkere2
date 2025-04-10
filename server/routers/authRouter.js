const router = require('express').Router();
const controller = require('../controllers/authController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const path = require('path');

// Публичные маршруты (доступны без авторизации)
router.post('/registration', [
    check('username', 'Username cannot be empty').notEmpty(),
    check('email', 'Email cannot be empty').notEmpty(),
    check('password', 'Password must be at least 4 characters').isLength({ min: 4, max: 12 }),
], controller.registration);

router.post('/login', controller.login);

router.get('/activate', controller.activateAccount);

router.post('/request-password-reset', [
    check('email', 'Email must be valid').notEmpty().isEmail(),
], controller.requestPasswordReset);

router.get('/forgot-password/:token', (req, res) => {
    const { token } = req.params;
    if (!token) {
        return res.status(400).send('Token is required');
    }
    res.redirect(`http://localhost:3000/forgot-password/${token}`);
});

router.post('/forgot-password', [
    check('token', 'Token is required').notEmpty(),
    check('newPassword', 'Password must be at least 4 characters').isLength({ min: 4 }),
], controller.resetPassword);

router.post('/verify', controller.verifyToken);
router.get('/user', authMiddleware, controller.getUser);

// Защищённые маршруты (требуют авторизации)
router.post('/logout', controller.logout);
router.get('/users', authMiddleware, roleMiddleware(['admin']), controller.getUsers);

module.exports = router;