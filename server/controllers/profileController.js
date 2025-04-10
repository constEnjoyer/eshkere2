const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProfileController {
    // Получить профиль текущего пользователя
    async getMyProfile(req, res) {
        try {
            const { userId } = req.user;

            const user = await prisma.users.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    profilePicture: true,
                    bio: true,
                    age: true,
                    phone: true, // Добавляем phone
                    location: true, // Добавляем location
                    userFriendships: {
                        where: { status: "accepted" }
                    },
                    friendFriendships: {
                        where: { status: "accepted" }
                    }
                }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Подсчитываем количество друзей
            const friendsCount = user.userFriendships.length + user.friendFriendships.length;

            // Формируем ответ
            const profile = {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture || null,
                bio: user.bio || null,
                age: user.age || null,
                phone: user.phone || null, // Возвращаем phone
                location: user.location || null, // Возвращаем location
                friendsCount,
                friendsUrl: '/friends/list' // Ссылка на список друзей
            };

            res.json(profile);
        } catch (error) {
            console.error('Error in getMyProfile:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    // Получить профиль другого пользователя по ID
    async getProfileById(req, res) {
        try {
            const { userId } = req.params;

            const user = await prisma.users.findUnique({
                where: { id: parseInt(userId) },
                select: {
                    id: true,
                    username: true,
                    profilePicture: true,
                    bio: true,
                    age: true,
                    userFriendships: {
                        where: { status: "accepted" }
                    },
                    friendFriendships: {
                        where: { status: "accepted" }
                    }
                }
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Подсчитываем количество друзей
            const friendsCount = user.userFriendships.length + user.friendFriendships.length;

            // Формируем ответ
            const profile = {
                id: user.id,
                username: user.username,
                profilePicture: user.profilePicture || null,
                bio: user.bio || null,
                age: user.age || null,
                friendsCount,
                friendsUrl: '/friends/list' // Ссылка на список друзей
            };

            res.json(profile);
        } catch (error) {
            console.error('Error in getProfileById:', error);
            res.status(500).json({ message: 'Server error' });
        }
    }

    async updateProfile(req, res) {
        try {
            const { userId } = req.user;
            const { username, profilePicture, bio, age, phone, location } = req.body;

            // Проверка валидности данных
            if (username && typeof username !== 'string') {
                return res.status(400).json({ message: 'Username must be a string' });
            }
            if (profilePicture && typeof profilePicture !== 'string') {
                return res.status(400).json({ message: 'Profile picture must be a string (URL)' });
            }
            if (bio && typeof bio !== 'string') {
                return res.status(400).json({ message: 'Bio must be a string' });
            }
            if (age && (isNaN(age) || age < 0 || age > 120)) {
                return res.status(400).json({ message: 'Age must be a number between 0 and 120' });
            }
            if (phone && typeof phone !== 'string') {
                return res.status(400).json({ message: 'Phone must be a string' });
            }
            if (location && typeof location !== 'string') {
                return res.status(400).json({ message: 'Location must be a string' });
            }

            // Обновляем профиль
            const updatedUser = await prisma.users.update({
                where: { id: userId },
                data: {
                    username: username || undefined,
                    profilePicture: profilePicture || undefined,
                    bio: bio || undefined,
                    age: age ? parseInt(age) : undefined,
                    phone: phone || undefined, // Добавляем обновление для phone
                    location: location || undefined // Добавляем обновление для location
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    profilePicture: true,
                    bio: true,
                    age: true,
                    phone: true, // Включаем phone в выборку
                    location: true, // Включаем location в выборку
                    userFriendships: {
                        where: { status: "accepted" }
                    },
                    friendFriendships: {
                        where: { status: "accepted" }
                    }
                }
            });

            // Подсчитываем количество друзей
            const friendsCount = updatedUser.userFriendships.length + updatedUser.friendFriendships.length;

            // Формируем ответ
            const profile = {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                profilePicture: updatedUser.profilePicture || null,
                bio: updatedUser.bio || null,
                age: updatedUser.age || null,
                phone: updatedUser.phone || null, // Возвращаем phone в ответе
                location: updatedUser.location || null, // Возвращаем location в ответе
                friendsCount,
                friendsUrl: '/friends/list'
            };
            res.json(profile);
        } catch (error) {
            console.error('Error in updateProfile:', error);
            if (error.code === 'P2002') {
                return res.status(400).json({ message: 'Username is already taken' });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
}

module.exports = new ProfileController();