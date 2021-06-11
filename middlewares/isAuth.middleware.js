const jwt = require('jsonwebtoken');
const errorHelper = require('../utils/error.helper');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        errorHelper.throwError('Authorization header is not provided', 401);
    }

    const token = authHeader.split(' ')[1]; // ignores the word  'Bearer' that comes with token.
    let decodedToken;

    try {
        decodedToken = jwt.verify(token, process.env.JWT_API_SECRET);
    } catch (err) {
        errorHelper.throwError('The token providades is invalid');
    }

    if (!decodedToken) {
        errorHelper.throwError('Not authenticated.', 401);
    }

    req.userId = decodedToken.userId;
    next();
};
