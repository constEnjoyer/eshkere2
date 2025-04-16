const express = require('express');
const router = express.Router();
const controller = require('../controllers/postsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Только для авторизованных пользователей

router.get('/', controller.getMyPosts); // Получить посты текущего пользователя
router.post('/create', controller.createPost);
router.get('/feed', controller.getFeed);
router.get("/search", controller.searchPosts);
router.get('/post/:id', controller.getPostById);
router.get('/user/:userId', controller.getUserPosts); // Новый маршрут

module.exports = router;