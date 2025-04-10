const express = require('express');
const router = express.Router();
const controller = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Только для авторизованных пользователей

router.get('/', controller.getMyProfile); // Получить профиль текущего пользователя
router.get('/:userId', controller.getProfileById); // Получить профиль другого пользователя
router.put('/update', controller.updateProfile); // Обновить профиль текущего пользователя

module.exports = router;