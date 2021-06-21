const jwt = require('jsonwebtoken');
const errorHelper = require('../utils/error.helper');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        req.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ')[1]; // ignores the word  'Bearer' that comes with token.
    let decodedToken;

    try {
        decodedToken = jwt.verify(token, process.env.JWT_API_SECRET);
    } catch (err) {
        req.isAuth = false;
        return next();
    }

    if (!decodedToken) {
        req.isAuth = false;
        return next();
    }

    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
};
