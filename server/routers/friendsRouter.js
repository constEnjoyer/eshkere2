const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async(req, res) => {
    try {
        const { userId } = req.user;
        console.log(`[GET /api/friends] Fetching friends for userId: ${userId}`);

        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [{ userId: userId }, { friendId: userId }],
                status: "accepted",
            },
            include: {
                user: { select: { id: true, username: true, profilePicture: true } },
                friend: { select: { id: true, username: true, profilePicture: true } },
            },
        });

        const friends = friendships.map((friendship) => {
            return friendship.userId === userId ? friendship.friend : friendship.user;
        });

        console.log(`[GET /api/friends] Friends fetched:`, friends);
        res.json(friends);
    } catch (error) {
        console.error(`[GET /api/friends] Error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Остальные маршруты остаются без изменений
router.get('/requests', async(req, res) => {
    try {
        const { userId } = req.user;
        console.log(`[GET /api/friends/requests] Fetching friend requests for userId: ${userId}`);

        const requests = await prisma.friendship.findMany({
            where: {
                friendId: userId,
                status: "pending",
            },
            include: {
                user: { select: { id: true, username: true, profilePicture: true } },
            },
        });

        const formattedRequests = requests.map((request) => ({
            id: request.id,
            userId: request.userId,
            friendId: request.friendId,
            requester: request.user,
        }));

        console.log(`[GET /api/friends/requests] Friend requests fetched:`, formattedRequests);
        res.json(formattedRequests);
    } catch (error) {
        console.error(`[GET /api/friends/requests] Error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/search', async(req, res) => {
    try {
        const { userId } = req.user;
        const { query } = req.query;
        console.log(`[GET /api/friends/search] Searching users for userId: ${userId} with query: ${query}`);

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const users = await prisma.users.findMany({
            where: {
                username: { contains: query, mode: 'insensitive' },
                id: { not: userId },
                NOT: {
                    userFriendships: {
                        some: {
                            friendId: userId,
                            status: "accepted",
                        },
                    },
                    friendFriendships: {
                        some: {
                            userId: userId,
                            status: "accepted",
                        },
                    },
                },
            },
            select: {
                id: true,
                username: true,
                profilePicture: true,
            },
            take: 10,
        });

        console.log(`[GET /api/friends/search] Found users:`, users);
        res.json(users);
    } catch (error) {
        console.error(`[GET /api/friends/search] Error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:userId', async(req, res) => {
    try {
        const userIdParam = req.params.userId;
        const userId = parseInt(userIdParam);
        console.log(`[GET /api/friends/${userIdParam}] Fetching friends for userId: ${userIdParam}`);

        if (isNaN(userId)) {
            console.log(`[GET /api/friends/${userIdParam}] Invalid userId: ${userIdParam}`);
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [{ userId: userId }, { friendId: userId }],
                status: "accepted",
            },
            include: {
                user: { select: { id: true, username: true, profilePicture: true } },
                friend: { select: { id: true, username: true, profilePicture: true } },
            },
        });

        const friends = friendships.map((friendship) => {
            return friendship.userId === userId ? friendship.friend : friendship.user;
        });

        console.log(`[GET /api/friends/${userIdParam}] Friends fetched:`, friends);
        res.json(friends);
    } catch (error) {
        console.error(`[GET /api/friends/${userIdParam}] Error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});



router.delete('/:friendId', async(req, res) => {
    try {
        const { userId } = req.user;
        const friendId = parseInt(req.params.friendId);
        console.log(`[DELETE /api/friends/${friendId}] Removing friend for userId: ${userId}`);

        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: userId, friendId: friendId },
                    { userId: friendId, friendId: userId },
                ],
                status: "accepted",
            },
        });

        if (!friendship) {
            console.log(`[DELETE /api/friends/${friendId}] Friendship not found`);
            return res.status(404).json({ message: 'Friendship not found' });
        }

        await prisma.friendship.delete({
            where: { id: friendship.id },
        });

        console.log(`[DELETE /api/friends/${friendId}] Friend removed`);
        res.status(204).send();
    } catch (error) {
        console.error(`[DELETE /api/friends/${friendId}] Error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});



router.post('/', async(req, res) => {
    try {
        const { userId } = req.user;
        const { friendId } = req.body;
        console.log(`[POST /api/friends] Sending friend request from userId: ${userId} to friendId: ${friendId}`);

        if (!friendId || friendId === userId) {
            return res.status(400).json({ message: 'Invalid friend ID' });
        }

        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: userId, friendId: friendId },
                    { userId: friendId, friendId: userId },
                ],
            },
        });

        if (existingFriendship) {
            return res.status(400).json({ message: 'Friendship request already exists or user is already a friend' });
        }

        const friendRequest = await prisma.friendship.create({
            data: {
                userId: userId,
                friendId: friendId,
                status: "pending",
            },
        });

        console.log(`[POST /api/friends] Friend request created:`, friendRequest);
        res.status(201).json(friendRequest);
    } catch (error) {
        console.error(`[POST /api/friends] Error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id/accept', async(req, res) => {
    try {
        const { userId } = req.user;
        const requestId = parseInt(req.params.id);
        console.log(`[PUT /api/friends/${requestId}/accept] Accepting friend request for userId: ${userId}`);

        const friendRequest = await prisma.friendship.findUnique({
            where: { id: requestId },
            include: {
                user: { select: { id: true, username: true, profilePicture: true } },
            },
        });

        if (!friendRequest || friendRequest.friendId !== userId || friendRequest.status !== "pending") {
            console.log(`[PUT /api/friends/${requestId}/accept] Invalid or unauthorized request`);
            return res.status(400).json({ message: 'Invalid or unauthorized friend request' });
        }

        const updatedFriendship = await prisma.friendship.update({
            where: { id: requestId },
            data: { status: "accepted" },
            include: {
                user: { select: { id: true, username: true, profilePicture: true } },
            },
        });

        console.log(`[PUT /api/friends/${requestId}/accept] Friend request accepted:`, updatedFriendship);
        res.json({...updatedFriendship, requester: updatedFriendship.user });
    } catch (error) {
        console.error(`[PUT /api/friends/${requestId}/accept] Error:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;