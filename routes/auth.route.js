const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom(async (value, { req }) => {
                const user = await User.findOne({ email: value });
                if (user) {
                    return Promise.reject('Email address already exists');
                }
            })
            .normalizeEmail(),
        body('password').trim().isLength({ min: 5 }),
        body('name').trim().notEmpty({ ignore_whitespace: false }),
    ],
    authController.singup
);

router.post('/singin', authController.singin);

module.exports = router;
