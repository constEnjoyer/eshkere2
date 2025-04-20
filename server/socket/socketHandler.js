const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const clients = new Map();

const verifyToken = (token) => {
    try {
        if (!process.env.SECRET_KEY) {
            console.error('[SocketHandler] SECRET_KEY is not defined');
            throw new Error('Server configuration error');
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log('[SocketHandler] Token verified:', { userId: decoded.id });
        return decoded;
    } catch (error) {
        console.error('[SocketHandler] Token verification failed:', {
            message: error.message,
            name: error.name,
        });
        return null;
    }
};

const setupSocket = (io) => {
    io.use((socket, next) => {
        const cookieHeader = socket.handshake.headers.cookie;
        console.log('[SocketHandler] Cookies received:', { cookieHeader, socketId: socket.id, headers: socket.handshake.headers });

        if (!cookieHeader) {
            console.log('[SocketHandler] No cookies provided for socket:', socket.id);
            socket.emit('error', { message: 'Unauthorized: No cookies provided' });
            return next(new Error('Unauthorized: No cookies'));
        }

        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split('=');
            acc[name] = value;
            return acc;
        }, {});

        const token = cookies.jwt;
        console.log('[SocketHandler] Extracted JWT:', { token: token ? 'Present' : 'Missing', socketId: socket.id });

        if (!token) {
            console.log('[SocketHandler] No JWT token in cookies for socket:', socket.id);
            socket.emit('error', { message: 'Unauthorized: No token' });
            return next(new Error('Unauthorized: No token'));
        }

        const decoded = verifyToken(token);
        if (!decoded || !decoded.id) {
            console.log('[SocketHandler] Invalid token or no user ID for socket:', socket.id);
            socket.emit('error', { message: 'Unauthorized: Invalid token' });
            return next(new Error('Unauthorized: Invalid token'));
        }

        socket.userId = parseInt(decoded.id);
        console.log('[SocketHandler] Socket authenticated:', { userId: socket.userId, socketId: socket.id });
        next();
    });

    io.on('connection', (socket) => {
        console.log(`[SocketHandler] User ${socket.userId} connected with socket ${socket.id}`);
        clients.set(socket.userId, socket);

        socket.on('message', async(data) => {
            try {
                const { recipientId, content } = data;
                console.log('[SocketHandler] Message received:', { senderId: socket.userId, recipientId, content });

                if (!recipientId || !content) {
                    console.log('[SocketHandler] Invalid message data:', { recipientId, content });
                    socket.emit('error', { message: 'Recipient ID and content are required' });
                    return;
                }

                const parsedRecipientId = parseInt(recipientId);
                if (isNaN(parsedRecipientId) || parsedRecipientId === socket.userId) {
                    console.log('[SocketHandler] Invalid recipient ID:', { recipientId });
                    socket.emit('error', { message: 'Invalid or same recipient ID' });
                    return;
                }

                const newMessage = await prisma.message.create({
                    data: {
                        senderId: socket.userId,
                        receiverId: parsedRecipientId,
                        content,
                    },
                });

                console.log('[SocketHandler] Message saved to DB:', newMessage);

                const recipientSocket = clients.get(parsedRecipientId);
                if (recipientSocket) {
                    recipientSocket.emit('message', {
                        id: newMessage.id,
                        senderId: socket.userId,
                        receiverId: parsedRecipientId,
                        content,
                        createdAt: newMessage.createdAt,
                    });
                    console.log('[SocketHandler] Message sent to recipient:', { recipientId: parsedRecipientId });
                }

                socket.emit('message', {
                    id: newMessage.id,
                    senderId: socket.userId,
                    receiverId: parsedRecipientId,
                    content,
                    createdAt: newMessage.createdAt,
                });
                console.log('[SocketHandler] Message sent to sender:', { senderId: socket.userId });
            } catch (error) {
                console.error('[SocketHandler] Error handling message:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                });
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            clients.delete(socket.userId);
            console.log(`[SocketHandler] User ${socket.userId} disconnected from socket ${socket.id}`);
        });
    });
};

module.exports = setupSocket;