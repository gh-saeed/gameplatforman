const express = require('express');
const gameController = require('../controllers/gameController');
const { protect, restrictTo } = require('../../middleware/authMiddleware'); // Adjusted path

const router = express.Router();

// GET /api/games - Get all games (public)
router.get('/', gameController.getAllGames);

// GET /api/games/:id - Get a single game by ID (public)
router.get('/:id', gameController.getGameById);

// POST /api/games - Add a new game (admin only)
router.post('/', protect, restrictTo('admin'), gameController.addGame);


// TODO: Add routes for updating and deleting games (admin only)
// router.patch('/:id', protect, restrictTo('admin'), gameController.updateGame);
// router.patch('/:id', protect, restrictTo('admin'), gameController.updateGame);
// router.delete('/:id', protect, restrictTo('admin'), gameController.deleteGame);

module.exports = router;
