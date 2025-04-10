const prisma = require('../prisma/client');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Генерация токена с учетом "Remember Me"
const generateAccessToken = (id, roles, rememberMe = false) => {
    const payload = { id, roles };
    const expiresIn = rememberMe ? '30d' : '24h'; // 30 дней если "Remember Me", иначе 24 часа
    return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn });
};

// Генерация токена и ссылки (универсальная функция для активации и сброса)
const generateTokenAndLink = (userId, purpose = 'activate') => {
    const token = jwt.sign({ id: userId, purpose }, process.env.SECRET_KEY, { expiresIn: '1h' });
    if (purpose === 'reset') {
        return `http://localhost:3000/forgot-password/${token}`;
    }
    return `http://localhost:5000/api/auth/activate?token=${token}`;
};

// Настройка Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Универсальная функция отправки email
const sendEmail = async(email, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        text,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`${subject} email sent to ${email}`);
    } catch (error) {
        console.log(`Error sending ${subject} email:`, error);
        throw error;
    }
};

class AuthController {
    async login(req, res) {
        try {
            const { email, password, rememberMe } = req.body; // Добавляем rememberMe
            console.log('Attempting login with:', email, 'Remember Me:', rememberMe);

            const user = await prisma.users.findFirst({
                where: {
                    email
                },
                include: { user_roles: { include: { roles: true } } },
            });

            if (!user) {
                console.log('User not found in DB');
                return res.status(400).json({ message: 'User not found' });
            }

            const validPassword = bcrypt.compareSync(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ message: 'Invalid password' });
            }

            if (!user.isActive) {
                return res.status(400).json({ message: 'Account not activated' });
            }

            const roles = user.user_roles.map(ur => ur.roles.value);
            const token = generateAccessToken(user.id, roles, rememberMe); // Передаем rememberMe

            // Сохранение токена в куки
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 дней или 24 часа
                sameSite: 'Strict',
            });

            return res.json({ message: 'Login successful' });
        } catch (error) {
            console.log('Login error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async registration(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Registration error', errors });
            }

            const { username, password, email } = req.body;

            const candidate = await prisma.users.findFirst({
                where: { email },
            });
            if (candidate) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashPassword = bcrypt.hashSync(password, 7);
            let userRole = await prisma.roles.findUnique({ where: { value: 'user' } });
            if (!userRole) {
                userRole = await prisma.roles.create({ data: { value: 'user' } });
            }

            const newUser = await prisma.users.create({
                data: {
                    username,
                    email,
                    password: hashPassword,
                    user_roles: { create: [{ role_id: userRole.id }] },
                    isActive: false,
                },
            });

            const activationLink = generateTokenAndLink(newUser.id, 'activate');
            await sendEmail(email, 'Активация аккаунта',
                `Для завершения регистрации перейдите по ссылке: ${activationLink}`);

            return res.json({ message: 'User created, activation email sent' });
        } catch (error) {
            console.log('Registration error:', error);
            res.status(400).json({ message: 'Registration error' });
        }
    }

    async activateAccount(req, res) {
        try {
            const { token } = req.query;
            const decoded = jwt.verify(token, process.env.SECRET_KEY);

            if (decoded.purpose !== 'activate') {
                return res.status(400).json({ message: 'Invalid token purpose' });
            }

            const user = await prisma.users.findUnique({ where: { id: decoded.id } });
            if (!user || user.isActive) {
                return res.status(400).json({ message: 'User not found or already activated' });
            }

            await prisma.users.update({
                where: { id: decoded.id },
                data: { isActive: true },
            });

            return res.redirect("http://localhost:3000")
        } catch (error) {
            console.log('Activation error:', error);
            res.status(400).json({ message: 'Invalid or expired token' });
        }
    }

    async logout(req, res) {
        try {
            res.clearCookie('jwt');
            return res.json({ message: 'Logout successful' });
        } catch (error) {
            console.log('Logout error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getUsers(req, res) {
        try {
            const users = await prisma.users.findMany({
                include: { user_roles: { include: { roles: true } } },
            });

            const formattedUsers = users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                roles: user.user_roles.map(ur => ur.roles.value),
                isActive: user.isActive,
            }));

            res.json(formattedUsers);
        } catch (error) {
            console.log('Get users error:', error);
            res.status(500).json({ message: 'Error fetching users' });
        }
    }

    async requestPasswordReset(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Validation error', errors });
            }
            const { email } = req.body;
            const user = await prisma.users.findUnique({ where: { email } });
            if (!user) {
                return res.json({ message: 'If the email exists, a password reset link will be sent' });
            }

            const resetToken = jwt.sign({ id: user.id, purpose: 'reset' }, process.env.SECRET_KEY, { expiresIn: '30m' });

            await prisma.passwordResetToken.create({
                data: {
                    token: resetToken,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
                },
            });

            const resetLink = `http://localhost:3000/forgot-password/${resetToken}`;

            await sendEmail(email, 'Сброс пароля',
                `Для сброса пароля перейдите по ссылке: ${resetLink}
Ссылка действительна 30 минут.`);

            return res.json({ message: 'Password reset link sent to your email' });
        } catch (error) {
            console.log('Request password reset error:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async resetPassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Validation error', errors });
            }

            const { token, newPassword } = req.body;

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.SECRET_KEY);
            } catch (err) {
                return res.status(400).json({ message: 'Invalid or expired token' });
            }

            if (decoded.purpose !== 'reset') {
                return res.status(400).json({ message: 'Invalid token purpose' });
            }

            const resetToken = await prisma.passwordResetToken.findUnique({
                where: { token },
            });

            if (!resetToken || resetToken.expiresAt < new Date()) {
                return res.status(400).json({ message: 'Invalid or expired token' });
            }

            const hashPassword = bcrypt.hashSync(newPassword, 7);

            await prisma.users.update({
                where: { id: resetToken.userId },
                data: { password: hashPassword },
            });

            await prisma.passwordResetToken.delete({
                where: { id: resetToken.id },
            });

            return res.json({ message: 'Password successfully reset' });
        } catch (error) {
            console.log('Reset password error:', error);
            res.status(400).json({ message: 'Invalid or expired token' });
        }
    }

    async verifyToken(req, res) {
        try {
            const { token } = req.body;
            jwt.verify(token, process.env.SECRET_KEY);
            return res.json({ message: 'Token is valid' });
        } catch (error) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
    }

    async getUser(req, res) {
        try {
            const { userId } = req.user; // Получаем userId из authMiddleware
            const user = await prisma.users.findUnique({
                where: { id: userId },
                include: { user_roles: { include: { roles: true } } },
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const formattedUser = {
                id: user.id,
                username: user.username,
                email: user.email,
                roles: user.user_roles.map(ur => ur.roles.value),
                isActive: user.isActive,
            };

            return res.json(formattedUser);
        } catch (error) {
            console.error("Get user error:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
}

module.exports = new AuthController();