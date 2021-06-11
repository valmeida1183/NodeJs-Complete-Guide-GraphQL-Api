const express = require('express');
const { body } = require('express-validator');

const userController = require('../controllers/user.controller');
const isAuth = require('../middlewares/isAuth.middleware');
const router = express.Router();

router.get('/current', isAuth, userController.getCurrentUser);
router.patch('/current-status', isAuth, [body('status').trim().not().isEmpty()], userController.updateUserStatus);

module.exports = router;
