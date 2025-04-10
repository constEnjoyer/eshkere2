const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Хранилище подключённых клиентов (Map: userId -> socket)
const clients = new Map();

// Проверка JWT-токена
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return null;
    }
};

const setupSocket = (io) => {
    // Middleware для проверки токена
    io.use((socket, next) => {
        const token = socket.handshake.query.token;
        console.log('Token received:', token);

        const decoded = verifyToken(token);
        if (!decoded) {
            return next(new Error('Unauthorized'));
        }

        socket.userId = decoded.id; // Сохраняем userId в объекте socket
        next();
    });

    // Обработка подключений
    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);
        clients.set(socket.userId, socket);

        // Обработка входящих сообщений
        socket.on('message', async(data) => {
            try {
                const { recipientId, content } = data;

                // Сохраняем сообщение в базе данных
                const newMessage = await prisma.messages.create({
                    data: {
                        senderId: socket.userId,
                        recipientId: parseInt(recipientId),
                        content,
                    },
                });

                // Отправляем сообщение получателю
                const recipientSocket = clients.get(parseInt(recipientId));
                if (recipientSocket) {
                    recipientSocket.emit('message', {
                        senderId: socket.userId,
                        content,
                        timestamp: newMessage.createdAt,
                    });
                } else {
                    console.log(`Recipient ${recipientId} not connected`);
                }

                // Подтверждение отправителю
                socket.emit('messageSent', {
                    message: 'Message sent',
                    content,
                    recipientId,
                });
            } catch (error) {
                console.log('Error handling message:', error);
                socket.emit('error', { error: 'Failed to send message' });
            }
        });

        // Обработка отключения
        socket.on('disconnect', () => {
            clients.delete(socket.userId);
            console.log(`User ${socket.userId} disconnected`);
        });
    });
};

module.exports = setupSocket;   