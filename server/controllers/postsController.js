const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PostsController {

    async getMyPosts(req, res) {
        try {
            const { userId } = req.user;
            const posts = await prisma.post.findMany({
                where: { authorId: userId },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    imageUrl: true,
                    location: true,
                    createdAt: true,
                },
            });
            res.json(posts);
        } catch (error) {
            console.error('Error in getMyPosts:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async createPost(req, res) {
        try {
            const { title, description, price, location, bedrooms, bathrooms, squareMeters } = req.body;
            const { userId } = req.user;

            const post = await prisma.post.create({
                data: {
                    title,
                    description,
                    price: parseFloat(price),
                    location,
                    authorId: userId,
                },
            });

            res.status(201).json({ message: 'Post created', post });
        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getFeed(req, res) {
        try {
            const posts = await prisma.post.findMany({
                orderBy: { createdAt: 'desc' },
                include: { author: true },
            });
            res.json(posts);
        } catch (error) {
            console.error('Get feed error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getPostById(req, res) {
        try {
            const { id } = req.params

            const post = await prisma.post.findUnique({
                where: {
                    id: Number(id)
                }
            })

            if (!post) {
                return res.status(404).json({ message: 'Post not found' })
            }

            res.json(post)
        } catch (error) {
            console.error('getPostById error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async searchPosts(req, res) {
        try {
            const { query } = req.query;
            const posts = await prisma.post.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        { location: { contains: query, mode: 'insensitive' } },
                    ],
                },
            });
            res.json(posts);
        } catch (error) {
            console.error('Search posts error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getUserPosts(req, res) {
        try {
            const { userId } = req.params;
            const posts = await prisma.post.findMany({
                where: { authorId: parseInt(userId) },
                orderBy: { createdAt: 'desc' },
            });
            res.json(posts);
        } catch (error) {
            console.error('Get user posts error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }


}

module.exports = new PostsController();