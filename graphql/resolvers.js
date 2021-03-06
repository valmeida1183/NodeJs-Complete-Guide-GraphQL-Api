const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const Post = require('../models/post');
const User = require('../models/user');
const errorHelper = require('../utils/error.helper');
const fileHelper = require('../utils/file.helper');
const mongooseModelHelper = require('../utils/mongooseModel.helper');

const signUp = async (args, req) => {
    const { email, name, password } = args.userInput;

    // Todo move validation to another file
    const errors = [];
    if (!validator.isEmail(email)) {
        errors.push({ message: 'Email is invalid' });
    }

    if (validator.isEmpty(password)) {
        errors.push({ message: 'Password is required' });
    }

    if (!validator.isLength(password, { min: 5 })) {
        errors.push({ message: 'Password has to be 5 or more caracters' });
    }

    if (errors.length > 0) {
        errorHelper.throwError('Invalid inputs', 422, errors);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        errorHelper.throwError('User with this email already exists!');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
        email,
        name,
        password: hashedPassword,
    });

    const createdUser = await user.save();
    // Clear mongoose meta data and return a clean user object with properties that only match with user schema definition.
    const userSchema = { ...createdUser._doc, _id: createdUser._id.toString() };

    return userSchema;
};

const signIn = async (args, req) => {
    const { email, password } = args;

    const user = await User.findOne({ email });
    if (!user) {
        errorHelper.throwError('User email or password is incorrect', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        errorHelper.throwError('User email or password is incorrect', 401);
    }

    const token = jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
        },
        process.env.JWT_API_SECRET,
        { expiresIn: '1h' }
    );

    return { token, userId: user._id.toString() };
};

const getPosts = async (args, req) => {
    let { page } = args;

    if (!req.isAuth) {
        errorHelper.throwError('Not Authenticated!', 401);
    }

    if (!page) {
        page = 1;
    }

    const perPage = 2;
    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate('creator');

    return {
        posts: posts.map(p => {
            return {
                ...p._doc,
                _id: p._id.toString(),
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
            };
        }),
        totalPosts,
    };
};

const getPost = async ({ id }, req) => {
    if (!req.isAuth) {
        errorHelper.throwError('Not Authenticated!', 401);
    }

    const post = await Post.findById(id).populate('creator');
    if (!post) {
        errorHelper.throwError('Post not Found!', 404);
    }

    const postMapped = mongooseModelHelper.mapModelToRawObject(post);
    postMapped.imageUrl = postMapped.imageUrl.replace(/\\/g, '/');
    return postMapped;
};

const createPost = async ({ postInput }, req) => {
    if (!req.isAuth) {
        errorHelper.throwError('Not Authenticated!', 401);
    }

    const { title, content, imageUrl } = postInput;

    const errors = [];
    if (validator.isEmpty(title)) {
        errors.push({ message: 'Title is required' });
    } else if (!validator.isLength(title, { min: 5 })) {
        errors.push({ message: 'Title has to be 5 or more caracters' });
    }

    if (validator.isEmpty(content)) {
        errors.push({ message: 'Content is required' });
    } else if (!validator.isLength(content, { min: 5 })) {
        errors.push({ message: 'Content has to be 5 or more caracters' });
    }

    if (errors.length > 0) {
        errorHelper.throwError('Invalid inputs', 422, errors);
    }

    const user = await User.findById(req.userId);
    if (!user) {
        errorHelper.throwError('Invalid User!', 401);
    }

    const post = new Post({
        title,
        content,
        imageUrl,
        creator: user,
    });

    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();

    return mongooseModelHelper.mapModelToRawObject(createdPost);
};

const updatePost = async ({ id, postInput }, req) => {
    if (!req.isAuth) {
        errorHelper.throwError('Not Authenticated!', 401);
    }

    const post = await Post.findById(id).populate('creator');
    if (!post) {
        errorHelper.throwError('Post not Found!', 404);
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
        errorHelper.throwError('Not authorized to edit this post!', 403);
    }

    const { title, content, imageUrl } = postInput;

    const errors = [];
    if (validator.isEmpty(title)) {
        errors.push({ message: 'Title is required' });
    } else if (!validator.isLength(title, { min: 5 })) {
        errors.push({ message: 'Title has to be 5 or more caracters' });
    }

    if (validator.isEmpty(content)) {
        errors.push({ message: 'Content is required' });
    } else if (!validator.isLength(content, { min: 5 })) {
        errors.push({ message: 'Content has to be 5 or more caracters' });
    }

    if (errors.length > 0) {
        errorHelper.throwError('Invalid inputs', 422, errors);
    }

    post.title = title;
    post.content = content;
    if (imageUrl !== 'undefined') {
        post.imageUrl = imageUrl;
    }

    const updatedPost = await post.save();

    return mongooseModelHelper.mapModelToRawObject(updatedPost);
};

const deletePost = async ({ id }, req) => {
    if (!req.isAuth) {
        errorHelper.throwError('Not Authenticated!', 401);
    }

    //Observe that in this example we do not call 'populate' with 'creator' flag, and then creator inside post object is a ObjectId
    const post = await Post.findById(id);
    if (!post) {
        errorHelper.throwError('Post not Found!', 404);
    }

    if (post.creator.toString() !== req.userId.toString()) {
        errorHelper.throwError('Not authorized to delete this post!', 403);
    }

    fileHelper.deleteFile(post.imageUrl);

    await Post.findByIdAndRemove(id);

    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();

    return true;
};

const getCurrentUser = async (args, req) => {
    if (!req.isAuth) {
        errorHelper.throwError('Not Authenticated!', 401);
    }

    const user = await User.findById(req.userId);
    if (!user) {
        errorHelper.throwError('User not Found!', 404);
    }

    return { ...user._doc, _id: user._id.toString() };
};

const updateUserStatus = async ({ status }, req) => {
    if (!req.isAuth) {
        errorHelper.throwError('Not Authenticated!', 401);
    }

    const errors = [];
    if (validator.isEmpty(status)) {
        errors.push({ message: 'Status is required' });
    }

    if (errors.length > 0) {
        errorHelper.throwError('Invalid inputs', 422, errors);
    }

    const user = await User.findById(req.userId);
    if (!user) {
        errorHelper.throwError('User not Found!', 404);
    }

    user.status = status;
    const updatedUser = await user.save();

    return { ...updatedUser._doc, _id: updatedUser._id.toString() };
};

module.exports = {
    signUp,
    signIn,
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    getCurrentUser,
    updateUserStatus,
};
