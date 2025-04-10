const express = require('express');
const router = express.Router();
const controller = require('../controllers/friendsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware); // Только для авторизованных пользователей

router.post('/send-request', controller.sendRequest);
router.post('/respond', controller.respondToRequest);
router.get('/list', controller.getFriends);
router.get('/requests', controller.getPendingRequests);
router.post('/remove', controller.removeFriend); // Изменили на POST

module.exports = router;