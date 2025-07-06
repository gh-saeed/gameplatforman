const express = require('express');
const scoreController = require('../controllers/scoreController');
const { protect } = require('../../middleware/authMiddleware'); // Adjusted path

const router = express.Router();

// POST /api/scores - Submit a new score (user must be logged in)
router.post('/', protect, scoreController.submitScore);

// GET /api/scores - Get scores (can be filtered by userId or gameId for leaderboards/history)
// This is public by default, but could be protected if only logged-in users can see scores.
router.get('/', scoreController.getScores);

// GET /api/scores/user-stats?gameId=<gameId> - Get detailed user statistics for a game
router.get('/user-stats', protect, scoreController.getUserStats);

// GET /api/scores/leaderboard?gameId=<gameId> - Get leaderboard for a game
router.get('/leaderboard', scoreController.getLeaderboard);

// GET /api/scores/total-leaderboard?gameId=<gameId> - Get leaderboard by total score for a game
router.get('/total-leaderboard', scoreController.getTotalScoreLeaderboard);


module.exports = router;
