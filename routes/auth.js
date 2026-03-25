// routes/auth.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

r.post('/register', [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })], c.register);
r.post('/login', c.login);
r.get('/me', protect, c.getMe);
r.put('/update-profile', protect, c.updateProfile);
r.put('/change-password', protect, c.changePassword);

module.exports = r;
