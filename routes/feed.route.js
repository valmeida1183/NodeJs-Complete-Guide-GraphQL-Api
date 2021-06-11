const express = require('express');
const { body } = require('express-validator');

const isAuth = require('../middlewares/isAuth.middleware');
const feedController = require('../controllers/feed.controller');

const router = express.Router();

// /feed/post
router.get('/posts', isAuth, feedController.getPosts);
router.get('/posts/:id', isAuth, feedController.getPost);

router.post(
    '/posts',
    isAuth,
    [body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
    feedController.createPost
);

router.put(
    '/posts/:id',
    isAuth,
    [body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
    feedController.updatePost
);

router.delete('/posts/:id', isAuth, feedController.deletePost);

module.exports = router;
