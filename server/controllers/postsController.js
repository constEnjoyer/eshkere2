const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PostsController {
  async createPost(req, res) {
    try {
      const { userId } = req.user;
      const { title, description, location, price, bedrooms, bathrooms, squareMeters } = req.body;
      console.log(`[POST /api/posts] Creating post for userId: ${userId}`, {
        title,
        description,
        location,
        price,
        bedrooms,
        bathrooms,
        squareMeters,
        filesCount: req.files?.length || 0,
      });

      // Валидация обязательных полей
      if (!title || !description || !location || !price) {
        console.log(`[POST /api/posts] Missing required fields`);
        return res.status(400).json({ message: 'Все обязательные поля (title, description, location, price) должны быть заполнены' });
      }

      // Валидация числовых полей
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        console.log(`[POST /api/posts] Invalid price: ${price}`);
        return res.status(400).json({ message: 'Цена должна быть положительным числом' });
      }

      // Проверка файлов
      if (!req.files || req.files.length === 0) {
        console.log(`[POST /api/posts] No files uploaded`);
        return res.status(400).json({ message: 'Требуется хотя бы одно изображение' });
      }

      // Проверка существования пользователя
      const user = await prisma.users.findUnique({
        where: { id: parseInt(userId) },
      });
      if (!user) {
        console.log(`[POST /api/posts] User not found: ${userId}`);
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const imageUrls = req.files.map(file => `/Uploads/posts/${file.filename}`);
      console.log(`[POST /api/posts] Generated image URLs:`, imageUrls);

      const post = await prisma.post.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          price: parsedPrice,
          bedrooms: bedrooms ? parseInt(bedrooms) : null,
          bathrooms: bathrooms ? parseInt(bathrooms) : null,
          squareMeters: squareMeters ? parseInt(squareMeters) : null,
          imageUrls,
          authorId: parseInt(userId),
          createdAt: new Date(),
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              profilePicture: true,
              skills: true,
            },
          },
        },
      });

      const response = {
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        description: post.description,
        location: post.location,
        price: post.price,
        bedrooms: post.bedrooms,
        bathrooms: post.bathrooms,
        squareMeters: post.squareMeters,
        imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls.map(url => `http://localhost:5000${url}`) : [],
        createdAt: post.createdAt,
        likes: [], // Новый пост, лайков пока нет
        seller: {
          id: post.author.id,
          name: post.author.username,
          email: post.author.email,
          phone: post.author.phone,
          avatar: post.author.profilePicture ? `http://localhost:5000${post.author.profilePicture}` : null,
          skills: Array.isArray(post.author.skills) ? post.author.skills : [],
        },
      };

      console.log(`[POST /api/posts] Post created:`, { id: response.id, title: response.title });
      res.status(201).json(response);
    } catch (error) {
      console.error(`[POST /api/posts] Error:`, error.message, error.stack);
      res.status(500).json({ message: 'Ошибка создания объявления', error: error.message });
    }
  }

  // Остальные методы (getPosts, getMultiplePosts, getUserPosts, getMyPosts, getPostById, deletePost, toggleLike)
  // остаются без изменений, так как они выглядят корректно и не связаны с текущей ошибкой.
  async getPosts(req, res) {
    try {
      console.log(`[GET /api/posts] Fetching posts`);
      const posts = await prisma.post.findMany({
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              profilePicture: true,
              skills: true,
            },
          },
          likes: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const response = posts.map(post => ({
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        description: post.description,
        location: post.location,
        price: post.price,
        bedrooms: post.bedrooms,
        bathrooms: post.bathrooms,
        squareMeters: post.squareMeters,
        imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls.map(url => `http://localhost:5000${url}`) : [],
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
      }));

      console.log(`[GET /api/posts] Posts fetched: ${response.length}`);
      res.json(response);
    } catch (error) {
      console.error(`[GET /api/posts] Error:`, error.message, error.stack);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  async getMultiplePosts(req, res) {
    try {
      const { postIds } = req.body;
      console.log(`[POST /api/posts/multiple] Fetching posts with IDs:`, postIds);

      if (!Array.isArray(postIds) || postIds.length === 0) {
        console.log(`[POST /api/posts/multiple] Invalid postIds`);
        return res.status(400).json({ message: 'Недействительный или пустой массив postIds' });
      }

      const posts = await prisma.post.findMany({
        where: {
          id: { in: postIds.map(id => parseInt(id)) },
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              profilePicture: true,
              skills: true,
            },
          },
          likes: true,
        },
      });

      const response = posts.map(post => ({
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        description: post.description,
        location: post.location,
        price: post.price,
        bedrooms: post.bedrooms,
        bathrooms: post.bathrooms,
        squareMeters: post.squareMeters,
        imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls.map(url => `http://localhost:5000${url}`) : [],
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
      }));

      console.log(`[POST /api/posts/multiple] Posts fetched: ${response.length}`);
      res.json(response);
    } catch (error) {
      console.error(`[POST /api/posts/multiple] Error:`, error.message, error.stack);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  async getUserPosts(req, res) {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`[GET /api/posts/user/${req.params.userId}] Fetching posts for userId: ${userId}`);

      if (isNaN(userId)) {
        console.log(`[GET /api/posts/user/${req.params.userId}] Invalid userId: ${req.params.userId}`);
        return res.status(400).json({ message: 'Недействительный ID пользователя' });
      }

      const posts = await prisma.post.findMany({
        where: { authorId: userId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              profilePicture: true,
              skills: true,
            },
          },
          likes: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const response = posts.map(post => ({
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        description: post.description,
        location: post.location,
        price: post.price,
        bedrooms: post.bedrooms,
        bathrooms: post.bathrooms,
        squareMeters: post.squareMeters,
        imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls.map(url => `http://localhost:5000${url}`) : [],
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
      }));

      console.log(`[GET /api/posts/user/${userId}] Posts fetched: ${response.length}`);
      res.json(response);
    } catch (error) {
      console.error(`[GET /api/posts/user/${req.params.userId}] Error:`, error.message, error.stack);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  async getMyPosts(req, res) {
    try {
      const userId = parseInt(req.user.userId);
      console.log(`[GET /api/posts/my] Fetching posts for userId: ${userId}`);

      if (isNaN(userId)) {
        console.log(`[GET /api/posts/my] Invalid userId: ${req.user.userId}`);
        return res.status(400).json({ message: 'Недействительный ID пользователя' });
      }

      const posts = await prisma.post.findMany({
        where: { authorId: userId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              profilePicture: true,
              skills: true,
            },
          },
          likes: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const response = posts.map(post => ({
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        description: post.description,
        location: post.location,
        price: post.price,
        bedrooms: post.bedrooms,
        bathrooms: post.bathrooms,
        squareMeters: post.squareMeters,
        imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls.map(url => `http://localhost:5000${url}`) : [],
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
      }));

      console.log(`[GET /api/posts/my] Posts fetched: ${response.length}`);
      res.json(response);
    } catch (error) {
      console.error(`[GET /api/posts/my] Error:`, error.message, error.stack);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  async getPostById(req, res) {
    try {
      const postId = parseInt(req.params.id);
      console.log(`[GET /api/posts/${postId}] Fetching post`);

      if (isNaN(postId)) {
        console.log(`[GET /api/posts/${req.params.id}] Invalid postId`);
        return res.status(400).json({ message: 'Недействительный ID поста' });
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              phone: true,
              profilePicture: true,
              skills: true,
            },
          },
          likes: true,
        },
      });

      if (!post) {
        console.log(`[GET /api/posts/${postId}] Post not found`);
        return res.status(404).json({ message: 'Пост не найден' });
      }

      const response = {
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        description: post.description,
        location: post.location,
        price: post.price,
        bedrooms: post.bedrooms,
        bathrooms: post.bathrooms,
        squareMeters: post.squareMeters,
        imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls.map(url => `http://localhost:5000${url}`) : [],
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
      };

      console.log(`[GET /api/posts/${postId}] Post fetched:`, { id: response.id, title: response.title });
      res.json(response);
    } catch (error) {
      console.error(`[GET /api/posts/${req.params.id}] Error:`, error.message, error.stack);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  async deletePost(req, res) {
    try {
      const { userId } = req.user;
      const postId = parseInt(req.params.id);
      console.log(`[DELETE /api/posts/${postId}] Deleting post for userId: ${userId}`);

      if (isNaN(postId)) {
        console.log(`[DELETE /api/posts/${req.params.id}] Invalid postId`);
        return res.status(400).json({ message: 'Недействительный ID поста' });
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        console.log(`[DELETE /api/posts/${postId}] Post not found`);
        return res.status(404).json({ message: 'Пост не найден' });
      }

      if (post.authorId !== userId) {
        console.log(`[DELETE /api/posts/${postId}] Unauthorized attempt by userId: ${userId}`);
        return res.status(403).json({ message: 'Вы не авторизованы для удаления этого поста' });
      }

      await prisma.post.delete({
        where: { id: postId },
      });

      console.log(`[DELETE /api/posts/${postId}] Post deleted`);
      res.status(204).send();
    } catch (error) {
      console.error(`[DELETE /api/posts/${req.params.id}] Error:`, error.message, error.stack);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }

  async toggleLike(req, res) {
    try {
      const { userId } = req.user;
      const postId = parseInt(req.params.postId);
      console.log(`[POST /api/posts/${postId}/like] Toggling like for userId: ${userId}`);

      if (isNaN(postId)) {
        console.log(`[POST /api/posts/${req.params.postId}/like] Invalid postId`);
        return res.status(400).json({ message: 'Недействительный ID поста' });
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        console.log(`[POST /api/posts/${postId}/like] Post not found`);
        return res.status(404).json({ message: 'Пост не найден' });
      }

      const existingLike = await prisma.like.findFirst({
        where: {
          userId: userId,
          postId: postId,
        },
      });

      if (existingLike) {
        await prisma.like.delete({
          where: { id: existingLike.id },
        });
        console.log(`[POST /api/posts/${postId}/like] Like removed`);
      } else {
        await prisma.like.create({
          data: {
            userId: userId,
            postId: postId,
          },
        });
        console.log(`[POST /api/posts/${postId}/like] Like added`);
      }

      const updatedLikes = await prisma.like.findMany({
        where: { postId: postId },
      });

      res.json({ likes: updatedLikes.map(like => like.userId) });
    } catch (error) {
      console.error(`[POST /api/posts/${req.params.postId}/like] Error:`, error.message, error.stack);
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }
}

module.exports = new PostsController();