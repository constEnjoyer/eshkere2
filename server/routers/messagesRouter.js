const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authMiddleware);

// Получение сообщений между текущим пользователем и другом
router.get('/', async(req, res) => {
    try {
        const { userId } = req.user;
        const { friendId } = req.query;

        console.log(`[GET /api/messages] Fetching messages for userId: ${userId}, friendId: ${friendId}`);

        if (!friendId) {
            console.log('[GET /api/messages] Friend ID is missing');
            return res.status(400).json({ message: 'Friend ID is required' });
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: parseInt(friendId) },
                    { senderId: parseInt(friendId), receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });

        console.log(`[GET /api/messages] Messages fetched:`, messages);
        res.json(messages);
    } catch (error) {
        console.error('[GET /api/messages] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Отправка сообщения
router.post('/', async(req, res) => {
    try {
        const { userId } = req.user;
        const { friendId, content } = req.body;

        console.log(`[POST /api/messages] Sending message from userId: ${userId} to friendId: ${friendId}`);

        if (!friendId || !content) {
            console.log('[POST /api/messages] Missing friendId or content');
            return res.status(400).json({ message: 'Friend ID and content are required' });
        }

        // Проверка дружбы
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: userId, friendId: friendId, status: 'accepted' },
                    { userId: friendId, friendId: userId, status: 'accepted' },
                ],
            },
        });

        if (!friendship) {
            console.log(`[POST /api/messages] No accepted friendship found for userId: ${userId}, friendId: ${friendId}`);
            return res.status(403).json({ message: 'You can only message your friends' });
        }

        const message = await prisma.message.create({
            data: {
                senderId: userId,
                receiverId: friendId,
                content,
            },
        });

        console.log('[POST /api/messages] Message created:', message);
        res.status(201).json(message);
    } catch (error) {
        console.error('[POST /api/messages] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;