const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authMiddleware);

// Получение сообщений
router.get('/', async(req, res) => {
    try {
        const { userId } = req.user;
        const { friendId } = req.query;

        console.log(`[GET /api/messages] Fetching messages for userId: ${userId}, friendId: ${friendId}`);

        if (!friendId) {
            console.log('[GET /api/messages] Friend ID is missing');
            return res.status(400).json({ message: 'Friend ID is required' });
        }

        const parsedFriendId = parseInt(friendId);
        if (isNaN(parsedFriendId)) {
            console.log('[GET /api/messages] Invalid friendId:', friendId);
            return res.status(400).json({ message: 'Invalid friend ID' });
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: parsedFriendId },
                    { senderId: parsedFriendId, receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'asc' },
        });

        console.log(`[GET /api/messages] Messages fetched:`, messages.length);
        res.json(messages);
    } catch (error) {
        console.error('[GET /api/messages] Error:', error.message, error.stack);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Отправка сообщения
router.post('/', async(req, res) => {
    try {
        const { userId } = req.user;
        const { friendId, content } = req.body;

        console.log(`[POST /api/messages] Sending message from userId: ${userId} to friendId: ${friendId}`);

        // Валидация входных данных
        if (!friendId || !content) {
            console.log('[POST /api/messages] Missing friendId or content:', { friendId, content });
            return res.status(400).json({ message: 'Friend ID and content are required' });
        }

        const parsedFriendId = parseInt(friendId);
        if (isNaN(parsedFriendId)) {
            console.log('[POST /api/messages] Invalid friendId:', friendId);
            return res.status(400).json({ message: 'Invalid friend ID' });
        }

        if (parsedFriendId === userId) {
            console.log('[POST /api/messages] Cannot send message to self:', userId);
            return res.status(400).json({ message: 'Cannot send message to yourself' });
        }

        // Проверка существования отправителя
        const sender = await prisma.users.findUnique({
            where: { id: userId },
        });
        if (!sender) {
            console.log(`[POST /api/messages] Sender not found for userId: ${userId}`);
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Проверка существования получателя
        const recipient = await prisma.users.findUnique({
            where: { id: parsedFriendId },
        });
        if (!recipient) {
            console.log(`[POST /api/messages] Recipient not found for friendId: ${parsedFriendId}`);
            return res.status(404).json({ message: 'Recipient not found' });
        }

        // Опционально: Проверка, что пользователи — друзья
        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: userId, friendId: parsedFriendId, status: 'accepted' },
                    { userId: parsedFriendId, friendId: userId, status: 'accepted' },
                ],
            },
        });
        if (!friendship) {
            console.log(`[POST /api/messages] No accepted friendship between userId: ${userId} and friendId: ${parsedFriendId}`);
            return res.status(403).json({ message: 'You can only message accepted friends' });
        }

        // Создание сообщения
        const message = await prisma.message.create({
            data: {
                senderId: userId,
                receiverId: parsedFriendId,
                content,
            },
        });

        console.log('[POST /api/messages] Message created:', message);
        res.status(201).json(message);
    } catch (error) {
        console.error('[POST /api/messages] Error:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack,
        });
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        await prisma.$disconnect();
    }
});

module.exports = router;