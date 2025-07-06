const express = require('express');
const { getUserProfile } = require('../controllers/userController');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// GET /api/profile - Get current logged-in user's profile
router.get('/profile', protect, getUserProfile);

// Other user-related routes can be added here in the future
// For example:
// router.put('/profile', protect, updateUserProfile);
// router.get('/users/:id/scores', protect, getUserScores); // Or this could be in scoreRoutes

module.exports = router;
