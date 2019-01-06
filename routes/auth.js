const express = require('express');
const { body } = require('express-validator/check');

const User = require('../models/user');
const authController = require('../controllers/authController');

const router = express.Router();

router.put('/signup', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid emaild')
    .custom((value, { req }) => {
      return User.findOne({
        where: { email: value }
      })
        .then(user => {
          if (user) {
            return Promise.reject('E-mail already exists');
          }
        })
    })
    .normalizeEmail()
], authController.signup);

router.post('/login', authController.login)

module.exports = router;