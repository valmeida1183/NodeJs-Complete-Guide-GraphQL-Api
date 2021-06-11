const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const fileStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        callback(null, `${uuidv4()}-${file.originalname}`);
    },
});

const fileFilter = (req, file, callback) => {
    const validMimeTypes = new Set(['image/png', 'image/jpg', 'image/jpeg']);
    const isValidMimeType = validMimeTypes.has(file.mimetype);

    callback(null, isValidMimeType);
};

module.exports = {
    fileStorage,
    fileFilter,
};
