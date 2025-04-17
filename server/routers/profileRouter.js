const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');
const fileUpload = require('express-fileupload');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authMiddleware);

// Получение профиля текущего пользователя
router.get('/', profileController.getMyProfile);

// Обновление профиля текущего пользователя
router.put('/update', profileController.updateProfile);

// Загрузка фото профиля текущего пользователя
router.post('/upload-photo', fileUpload(), profileController.uploadPhoto);

// Получение профиля другого пользователя по ID
router.get('/:userId', async(req, res) => {
    try {
        const { userId } = req.params;
        const parsedUserId = parseInt(userId);
        if (isNaN(parsedUserId)) {
            console.log(`[GET /api/profile/${userId}] Invalid userId: ${userId}`);
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        console.log(`[GET /api/profile/${userId}] Fetching profile for userId: ${parsedUserId}`);

        const user = await prisma.users.findUnique({
            where: { id: parsedUserId },
            select: {
                id: true,
                username: true,
                email: true,
                profilePicture: true,
                bio: true,
                phone: true,
                location: true,
                skills: true,
                userFriendships: { where: { status: "accepted" } },
                friendFriendships: { where: { status: "accepted" } },
                posts: { select: { id: true } },
            },
        });

        if (!user) {
            console.log(`[GET /api/profile/${userId}] User not found`);
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = {
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture ? `http://localhost:5000${user.profilePicture}` : null,
            bio: user.bio || null,
            phone: user.phone || null,
            location: user.location || null,
            skills: user.skills || [],
            friendsCount: user.userFriendships.length + user.friendFriendships.length,
            postsCount: user.posts.length,
            eventsCount: user.posts.length,
        };

        console.log(`[GET /api/profile/${userId}] Profile fetched:`, profile);
        res.json(profile);
    } catch (error) {
        console.error(`[GET /api/profile/${userId}] Error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;