const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');
const errorHelper = require('../utils/error.helper');
const fileHelper = require('../utils/file.helper');
const socketHelper = require('../utils/socket.helper');

const getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;

    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        res.status(200).json({ message: 'Fetched posts successfully', posts, totalItems });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};

const getPost = async (req, res, next) => {
    const { id } = req.params;

    try {
        const post = await Post.findById(id);
        if (!post) {
            errorHelper.throwError('Cannot find a post', 404);
        }

        res.status(200).json({ message: 'Post fetched', post });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};

const createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorHelper.throwError('Validation failed, entered data is incorrect', 422);
    }

    if (!req.file) {
        errorHelper.throwError('No image provided', 422);
    }

    const imageUrl = req.file.path.replace('\\', '/');
    const { title, content } = req.body;

    const post = new Post({
        title,
        content,
        imageUrl,
        creator: req.userId,
    });

    try {
        await post.save();

        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();

        socketHelper
            .getIo()
            .emit('posts', { action: 'create', post: { ...post._doc, creator: { _id: req.userId, name: user.name } } });

        res.status(201).json({
            message: 'Post created successfuly!',
            post: post,
            creator: { _id: user._id, name: user.name },
        });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};

const updatePost = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        errorHelper.throwError('Validation failed, entered data is incorrect', 422);
    }

    const { id } = req.params;
    const { title, content } = req.body;
    let imageUrl = req.body.image;

    if (req.file) {
        imageUrl = req.file.path.replace('\\', '/');
    }
    if (!imageUrl) {
        errorHelper.throwError('No image provided', 422);
    }

    try {
        const post = await Post.findById(id).populate('creator');
        if (!post) {
            errorHelper.throwError('Cannot find a post', 404);
        }

        if (post.creator._id.toString() !== req.userId) {
            errorHelper.throwError('Not authorized.', 403);
        }

        if (imageUrl !== post.imageUrl) {
            fileHelper.deleteFile(post.imageUrl);
        }

        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;

        const updatedPost = await post.save();

        socketHelper.getIo().emit('posts', { action: 'update', post: updatedPost });

        res.status(200).json({ message: 'Post updated', post: updatedPost });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};

const deletePost = async (req, res, next) => {
    const { id } = req.params;

    try {
        const post = await Post.findById(id);
        if (!post) {
            errorHelper.throwError('Cannot find a post', 404);
        }

        if (post.creator.toString() !== req.userId) {
            errorHelper.throwError('Not authorized.', 403);
        }

        fileHelper.deleteFile(post.imageUrl);
        await Post.findByIdAndDelete(id);

        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();

        socketHelper.getIo().emit('posts', { action: 'delete', post: id });

        res.status(200).json({ message: 'Post deleted' });
    } catch (error) {
        errorHelper.handleError(error, next);
    }
};

module.exports = {
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
};
