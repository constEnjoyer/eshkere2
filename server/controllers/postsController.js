const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PostsController {
    async getMyPosts(req, res) {
        try {
            const { userId } = req.user;
            const posts = await prisma.post.findMany({
                where: { authorId: userId },
                include: {
                    likes: { select: { userId: true } },
                },
            });
            res.json(posts.map(post => ({
                id: post.id,
                title: post.title,
                description: post.description,
                imageUrl: post.imageUrl,
                location: post.location,
                createdAt: post.createdAt,
                price: post.price,
                bedrooms: post.bedrooms,
                bathrooms: post.bathrooms,
                squareMeters: post.squareMeters,
                likes: post.likes.map(like => like.userId),
            })));
        } catch (error) {
            console.error('Error in getMyPosts:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async createPost(req, res) {
        try {
            const { title, description, price, location, bedrooms, bathrooms, squareMeters, imageUrl } = req.body;
            const { userId } = req.user;

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
                message: 'Post created',
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
            console.error('Create post error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getFeed(req, res) {
        try {
            const posts = await prisma.post.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: { id: true, username: true, email: true, phone: true, profilePicture: true, skills: true },
                    },
                    likes: { select: { userId: true } },
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
                    phone: post.author.phone || '',
                    avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
                    skills: post.author.skills || [],
                },
            })));
        } catch (error) {
            console.error('Get feed error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getPostById(req, res) {
        try {
            const { id } = req.params;
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                console.log(`[GET /api/posts/${id}] Invalid postId: ${id}`);
                return res.status(400).json({ message: 'Invalid post ID' });
            }
            console.log(`[GET /api/posts/${id}] Fetching post for postId: ${parsedId}`);

            const post = await prisma.post.findUnique({
                where: { id: parsedId },
                include: {
                    author: {
                        select: { id: true, username: true, email: true, phone: true, profilePicture: true, skills: true },
                    },
                    likes: { select: { userId: true } },
                },
            });

            if (!post) {
                console.log(`[GET /api/posts/${id}] Post not found`);
                return res.status(404).json({ message: 'Post not found' });
            }

            res.json({
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
                    phone: post.author.phone || '',
                    avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
                    skills: post.author.skills || [],
                },
            });
        } catch (error) {
            console.error(`[GET /api/posts/${id}] Error:`, error);
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
                include: {
                    author: {
                        select: { id: true, username: true, email: true, phone: true, profilePicture: true, skills: true },
                    },
                    likes: { select: { userId: true } },
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
                    phone: post.author.phone || '',
                    avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
                    skills: post.author.skills || [],
                },
            })));
        } catch (error) {
            console.error('Search posts error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getUserPosts(req, res) {
        try {
            const { userId } = req.params;
            const parsedUserId = parseInt(userId);
            if (isNaN(parsedUserId)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }
            const posts = await prisma.post.findMany({
                where: { authorId: parsedUserId },
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: { id: true, username: true, email: true, phone: true, profilePicture: true, skills: true },
                    },
                    likes: { select: { userId: true } },
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
                    phone: post.author.phone || '',
                    avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
                    skills: post.author.skills || [],
                },
            })));
        } catch (error) {
            console.error('Get user posts error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async likePost(req, res) {
        try {
            const { userId } = req.user;
            const { id } = req.params;
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                return res.status(400).json({ message: 'Invalid post ID' });
            }

            const post = await prisma.post.findUnique({
                where: { id: parsedId },
                include: { likes: { select: { userId: true } } },
            });

            if (!post) {
                return res.status(404).json({ message: 'Post not found' });
            }

            const isLiked = post.likes.some(like => like.userId === userId);

            if (isLiked) {
                await prisma.like.deleteMany({
                    where: { postId: parsedId, userId },
                });
            } else {
                await prisma.like.create({
                    data: { postId: parsedId, userId },
                });
            }

            const updatedPost = await prisma.post.findUnique({
                where: { id: parsedId },
                include: {
                    author: {
                        select: { id: true, username: true, email: true, phone: true, profilePicture: true, skills: true },
                    },
                    likes: { select: { userId: true } },
                },
            });

            res.json({
                id: updatedPost.id,
                authorId: updatedPost.authorId,
                title: updatedPost.title,
                description: updatedPost.description,
                location: updatedPost.location,
                price: updatedPost.price,
                bedrooms: updatedPost.bedrooms,
                bathrooms: updatedPost.bathrooms,
                squareMeters: updatedPost.squareMeters,
                imageUrl: updatedPost.imageUrl,
                createdAt: updatedPost.createdAt,
                likes: updatedPost.likes.map(like => like.userId),
                seller: {
                    id: updatedPost.author.id,
                    name: updatedPost.author.username,
                    email: updatedPost.author.email,
                    phone: updatedPost.author.phone || '',
                    avatar: updatedPost.author.profilePicture ? `http://localhost:5000${updatedPost.author.profilePicture}` : null,
                    skills: updatedPost.author.skills || [],
                },
            });
        } catch (error) {
            console.error('Like post error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getMultiplePosts(req, res) {
        try {
            const { postIds } = req.body;
            if (!Array.isArray(postIds) || postIds.length === 0) {
                console.log('[POST /api/posts/multiple] Invalid or empty postIds array');
                return res.status(400).json({ message: 'Invalid or empty postIds array' });
            }
            console.log('[POST /api/posts/multiple] Fetching posts for postIds:', postIds);

            const parsedPostIds = postIds.map(id => parseInt(id)).filter(id => !isNaN(id));
            if (parsedPostIds.length === 0) {
                return res.status(400).json({ message: 'No valid post IDs provided' });
            }

            const posts = await prisma.post.findMany({
                where: { id: { in: parsedPostIds } },
                include: {
                    author: {
                        select: { id: true, username: true, email: true, phone: true, profilePicture: true, skills: true },
                    },
                    likes: { select: { userId: true } },
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
                    phone: post.author.phone || '',
                    avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
                    skills: post.author.skills || [],
                },
            })));
        } catch (error) {
            console.error('[POST /api/posts/multiple] Error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const parsedId = parseInt(id);
            if (isNaN(parsedId)) {
                console.log(`[GET /api/users/${id}] Invalid userId: ${id}`);
                return res.status(400).json({ message: 'Invalid user ID' });
            }
            console.log(`[GET /api/users/${id}] Fetching user for userId: ${parsedId}`);

            const user = await prisma.user.findUnique({
                where: { id: parsedId },
                select: { id: true, username: true, profilePicture: true },
            });

            if (!user) {
                console.log(`[GET /api/users/${id}] User not found`);
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                id: user.id,
                username: user.username,
                profilePicture: user.profilePicture ? `http://localhost:5000${user.profilePicture}` : null,
            });
        } catch (error) {
            console.error(`[GET /api/users/${id}] Error:`, error);
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new PostsController();