const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const errorHelper = require('../utils/error.helper');
const { load } = require('dotenv');

exports.singup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorHelper.throwError('Validation failed.', 422, errors.array());
    }

    const { email, name, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ email: email, password: hashedPassword, name: name });
        const savedUser = await user.save();

        res.status(201).json({ message: 'User created!', userId: savedUser._id });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};

exports.singin = async (req, res, next) => {
    const { email, password } = req.body;
    let loadedUser;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            errorHelper.throwError('Invalid email or password', 401);
        }

        loadedUser = user;
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            errorHelper.throwError('Invalid email or password', 401);
        }

        // TODO create Jwt
        const token = jwt.sign(
            {
                email: loadedUser.email,
                userId: loadedUser._id.toString(),
            },
            process.env.JWT_API_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token, userId: loadedUser._id.toString() });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};
