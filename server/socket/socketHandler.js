const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('[socketHandler] New socket connection:', socket.id);

    const token = socket.handshake.auth.token || socket.request.headers.cookie?.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1];
    console.log('[socketHandler] Token received:', { token: token ? 'present' : 'missing' });

    if (!token) {
      console.log('[socketHandler] No token provided for socket:', socket.id);
      socket.emit('error', { message: 'Требуется авторизация' });
      socket.disconnect();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      console.log('[socketHandler] Token verified:', { userId: decoded.userId, type: typeof decoded.userId });
      socket.userId = parseInt(decoded.userId, 10);

      if (isNaN(socket.userId)) {
        console.log('[socketHandler] Invalid userId:', decoded.userId);
        socket.emit('error', { message: 'Недействительный ID пользователя' });
        socket.disconnect();
        return;
      }

      socket.on('message', async (data) => {
        console.log('[socketHandler] Message received:', { senderId: socket.userId, data });

        const { receiverId, content } = data;
        if (!receiverId || !content || content.trim() === '') {
          console.log('[socketHandler] Invalid message data:', { receiverId, content });
          socket.emit('error', { message: 'Недействительные данные сообщения' });
          return;
        }

        try {
          const parsedReceiverId = parseInt(receiverId, 10);
          if (isNaN(parsedReceiverId)) {
            console.log('[socketHandler] Invalid receiverId:', receiverId);
            socket.emit('error', { message: 'Недействительный ID получателя' });
            return;
          }

          const message = await prisma.message.create({
            data: {
              senderId: socket.userId,
              receiverId: parsedReceiverId,
              content: content.trim(),
              createdAt: new Date(),
            },
          });

          console.log('[socketHandler] Message saved:', { id: message.id, content: message.content });

          io.to(`user-${receiverId}`).emit('message', {
            id: message.id,
            senderId: socket.userId,
            receiverId: parsedReceiverId,
            content: message.content,
            createdAt: message.createdAt,
          });

          socket.emit('message', {
            id: message.id,
            senderId: socket.userId,
            receiverId: parsedReceiverId,
            content: message.content,
            createdAt: message.createdAt,
          });
        } catch (error) {
          console.error('[socketHandler] Error saving message:', error.message, error.stack);
          socket.emit('error', { message: 'Не удалось отправить сообщение' });
        }
      });

      socket.join(`user-${socket.userId}`);
      console.log('[socketHandler] User joined room:', `user-${socket.userId}`);

      socket.on('disconnect', () => {
        console.log('[socketHandler] Socket disconnected:', socket.id);
      });
    } catch (error) {
      console.error('[socketHandler] Token verification failed:', error.message, error.stack);
      socket.emit('error', { message: 'Недействительный токен' });
      socket.disconnect();
    }
  });
};