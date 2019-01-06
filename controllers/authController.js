const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  try {
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }
    const hashedPas = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email: email,
      password: hashedPas,
      name: name
    });
    res.status(201).json({ message: 'User created', user: newUser })
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const loadedUser = await User.findOne({
      where: {
        email: email
      }
    });
    if (!loadedUser) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, loadedUser.password);
    if (!isEqual) {
      const error = new Error('Wrong pass');
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign({
      email: loadedUser.email,
      id: loadedUser.id
    },
      'secret',
      { expiresIn: '1h' });
    res.status(200).json({ token: token, userId: loadedUser.id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};