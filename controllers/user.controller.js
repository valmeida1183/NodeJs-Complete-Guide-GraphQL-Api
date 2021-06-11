const { validationResult } = require('express-validator');

const User = require('../models/user');
const errorHelper = require('../utils/error.helper');

const getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            errorHelper.throwError('User not Found', 404);
        }

        res.status(200).json({ message: 'Current user fetched', user });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};

const updateUserStatus = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorHelper.throwError('Validation failed', 422, errors.array());
    }

    const { status } = req.body;

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            errorHelper.throwError('User not Found', 404);
        }

        user.status = status;
        await user.save();

        res.status(200).json({ message: 'User status is updated!' });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};

module.exports = {
    getCurrentUser,
    updateUserStatus,
};
