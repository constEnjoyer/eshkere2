const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const authRouter = require('./routers/authRouter');
const initializeRoles = require('./config/roles');
const setupSocket = require('./socket/socketHandler');
const cors = require('cors');
const friendsRouter = require('./routers/friendsRouter');
const profileRouter = require('./routers/profileRouter');
const postsRouter = require('./routers/postsRouter');
const messagesRouter = require('./routers/messagesRouter');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Для доступа к загруженным фото

// Routes
app.use('/api/auth', authRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/posts', postsRouter);
app.use('/api/messages', messagesRouter);

// Создание HTTP-сервера
const server = http.createServer(app);

// Инициализация Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

// Инициализация ролей и Socket.IO
const start = async() => {
    try {
        await initializeRoles();
        setupSocket(io);
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.log('Error starting the server:', error);
    }
};

start();