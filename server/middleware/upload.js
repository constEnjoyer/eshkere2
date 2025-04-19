const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
    destination: async(req, file, cb) => {
        // Определяем тип загрузки на основе маршрута
        const isProfileRoute = req.path === '/api/profile/upload-photo';
        const uploadType = isProfileRoute ? 'profiles' : 'posts';
        const uploadPath = path.join(__dirname, `../Uploads/${uploadType}`);

        console.log(`[UploadMiddleware] Request path: ${req.path}`);
        console.log(`[UploadMiddleware] Determined uploadType: ${uploadType}, uploadPath: ${uploadPath}`);

        try {
            // Создаём папку, если она не существует
            await fs.mkdir(uploadPath, { recursive: true });
            console.log(`[UploadMiddleware] Directory ensured: ${uploadPath}`);
            cb(null, uploadPath);
        } catch (error) {
            console.error(`[UploadMiddleware] Error creating directory ${uploadPath}:`, error);
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = `${uniqueSuffix}-${file.originalname}`;
        console.log(`[UploadMiddleware] Generated filename: ${filename}`);
        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.error(`[UploadMiddleware] Invalid file type: ${file.mimetype}`);
        cb(new Error('Только изображения (JPEG, PNG, GIF) разрешены'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Images only (jpeg, png, gif)!'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).array('images', 5); // Поле 'images', до 5 файлов

module.exports = upload;