const { validationResult } = require('express-validator/check');
const io = require('../socket');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const page = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.count();
    const posts = await Post.findAll({
      offset: (page - 1) * perPage,
      limit: perPage
    });
    io.getIo().emit('posts', { action: 'get', post: posts });
    res.status(200).json({
      Message: 'Posts founds',
      posts: posts,
      totalItems: totalItems
    })
  } catch (err) {
    if (err.statusCode != 500) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findByPk(postId)
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ post: post });
  } catch (err) {
    if (err.statusCode != 500) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.body.imageUrl;
  const creator = req.body.creator;
  try {
    const post = await Post.create({
      title: title,
      imageUrl: imageUrl,
      content: content,
      creator: creator
    });
    io.getIo().emit('posts', { action: 'create', post: post });
    res.status(201).json({
      Message: 'Post created',
      post: post
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.body.imageUrl;
  try {
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const post = await Post.findByPk(postId);
    verifyPostAuth(post, req);
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const postUpdated = await post.save();
    io.getIo().emit('posts', { action: 'update', post: postUpdated});
    res.status(200).json({
      Message: 'Post updated',
      post: postUpdated
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await Post.findByPk(postId);
    verifyPostAuth(post, req);
    const deletedPost = await Post.destroy({
      where: {
        id: postId
      }
    });
    res.status(200).json({ Message: 'Post destroyed', post: deletedPost });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

function verifyPostAuth(post, req) {
  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }
  if (post.creator != req.userId) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }
} 