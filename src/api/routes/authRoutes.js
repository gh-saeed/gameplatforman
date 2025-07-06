const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', authController.signup);

// POST /api/auth/login
router.post('/login', authController.login);

// TODO: Add routes for OTP if implemented
// router.post('/send-otp', authController.sendOtp);
// router.post('/verify-otp', authController.verifyOtp);

module.exports = router;
