const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Получение всех постов
router.get('/feed', async(req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                author: {
                    select: { id: true, username: true, email: true, phone: true, profilePicture: true, skills: true },
                },
                likes: {
                    select: { userId: true },
                },
            },
        });
        res.json(posts.map(post => ({
            id: post.id,
            authorId: post.authorId,
            title: post.title,
            description: post.description,
            location: post.location,
            price: post.price,
            bedrooms: post.bedrooms,
            bathrooms: post.bathrooms,
            squareMeters: post.squareMeters,
            imageUrl: post.imageUrl,
            createdAt: post.createdAt,
            likes: post.likes.map(like => like.userId), // Преобразуем likes в массив userId
            seller: {
                id: post.author.id,
                name: post.author.username,
                email: post.author.email,
                phone: post.author.phone,
                avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
                skills: post.author.skills || [],
            },
        })));
    } catch (error) {
        console.error('[GET /api/posts/feed] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Получение нескольких постов по ID
router.post('/multiple', async(req, res) => {
    try {
        const { postIds } = req.body;
        if (!Array.isArray(postIds) || postIds.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty postIds array' });
        }
        const posts = await prisma.post.findMany({
            where: { id: { in: postIds.map(id => parseInt(id)) } },
            include: {
                author: {
                    select: { id: true, username: true, email: true, phone: true, profilePicture: true, skills: true },
                },
                likes: {
                    select: { userId: true },
                },
            },
        });
        res.json(posts.map(post => ({
            id: post.id,
            authorId: post.authorId,
            title: post.title,
            description: post.description,
            location: post.location,
            price: post.price,
            bedrooms: post.bedrooms,
            bathrooms: post.bathrooms,
            squareMeters: post.squareMeters,
            imageUrl: post.imageUrl,
            createdAt: post.createdAt,
            likes: post.likes.map(like => like.userId),
            seller: {
                id: post.author.id,
                name: post.author.username,
                email: post.author.email,
                phone: post.author.phone,
                avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
                skills: post.author.skills || [],
            },
        })));
    } catch (error) {
        console.error('[POST /api/posts/multiple] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Лайк поста
router.post('/:id/like', async(req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const userId = req.user.userId;
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const existingLike = await prisma.like.findUnique({
            where: { postId_userId: { postId, userId } },
        });

        if (existingLike) {
            await prisma.like.delete({
                where: { postId_userId: { postId, userId } },
            });
        } else {
            await prisma.like.create({
                data: { postId, userId },
            });
        }

        const updatedPost = await prisma.post.findUnique({
            where: { id: postId },
            include: { likes: { select: { userId: true } } },
        });

        res.json({
            id: updatedPost.id,
            likes: updatedPost.likes.map(like => like.userId),
        });
    } catch (error) {
        console.error('[POST /api/posts/:id/like] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Создание поста
router.post('/', async(req, res) => {
    try {
        const { title, description, price, location, bedrooms, bathrooms, squareMeters, imageUrl } = req.body;
        const userId = req.user.userId;

        const post = await prisma.post.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                location,
                bedrooms: parseInt(bedrooms) || null,
                bathrooms: parseInt(bathrooms) || null,
                squareMeters: parseFloat(squareMeters) || null,
                imageUrl: imageUrl || null,
                authorId: userId,
            },
            include: {
                author: true,
                likes: { select: { userId: true } },
            },
        });

        res.status(201).json({
            post: {
                id: post.id,
                authorId: post.authorId,
                title: post.title,
                description: post.description,
                location: post.location,
                price: post.price,
                bedrooms: post.bedrooms,
                bathrooms: post.bathrooms,
                squareMeters: post.squareMeters,
                imageUrl: post.imageUrl,
                createdAt: post.createdAt,
                likes: post.likes.map(like => like.userId),
                seller: {
                    id: post.author.id,
                    name: post.author.username,
                    email: post.author.email,
                    phone: post.author.phone,
                    avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
                    skills: post.author.skills || [],
                },
            },
        });
    } catch (error) {
        console.error('[POST /api/posts] Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;