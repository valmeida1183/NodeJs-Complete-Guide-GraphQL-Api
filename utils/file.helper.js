const fs = require('fs');
const path = require('path');

exports.deleteFile = filePath => {
    const currentPath = path.resolve('./');
    filePath = path.join(currentPath, filePath);

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
            if (err) {
                throw new Error(err);
            }
        });
    }
};
