const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const clients = new Map();

const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return null;
    }
};

const setupSocket = (io) => {
    io.use((socket, next) => {
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) {
            console.log('No cookies provided');
            return next(new Error('Unauthorized: No cookies'));
        }

        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split('=');
            acc[name] = value;
            return acc;
        }, {});

        const token = cookies.jwt;
        if (!token) {
            console.log('No JWT token in cookies');
            return next(new Error('Unauthorized: No token'));
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return next(new Error('Unauthorized: Invalid token'));
        }

        socket.userId = parseInt(decoded.id);
        next();
    });

    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);
        clients.set(socket.userId, socket);

        socket.on('message', async(data) => {
            try {
                const { recipientId, content } = data;

                const newMessage = await prisma.message.create({
                    data: {
                        senderId: socket.userId,
                        receiverId: parseInt(recipientId),
                        content,
                    },
                });

                const recipientSocket = clients.get(parseInt(recipientId));
                if (recipientSocket) {
                    recipientSocket.emit('message', {
                        id: newMessage.id,
                        senderId: socket.userId,
                        receiverId: parseInt(recipientId),
                        content,
                        createdAt: newMessage.createdAt,
                    });
                }

                socket.emit('message', {
                    id: newMessage.id,
                    senderId: socket.userId,
                    receiverId: parseInt(recipientId),
                    content,
                    createdAt: newMessage.createdAt,
                });
            } catch (error) {
                console.error('Error handling message:', error);
                socket.emit('error', { error: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            clients.delete(socket.userId);
            console.log(`User ${socket.userId} disconnected`);
        });
    });
};

module.exports = setupSocket;