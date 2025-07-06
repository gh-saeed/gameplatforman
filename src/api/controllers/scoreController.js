const Score = require('../../models/Score');
const Game = require('../../models/Game'); // To validate gameId
const mongoose = require('mongoose');


// Submit a score for a game
exports.submitScore = async (req, res) => {
  try {
    const { gameId, score, playDuration } = req.body;
    const userId = req.user._id; // Comes from 'protect' middleware

    if (!gameId || score === undefined || playDuration === undefined) {
      return res.status(400).json({ message: 'Please provide gameId, score, and playDuration.' });
    }

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        return res.status(400).json({ message: 'Invalid game ID format.' });
    }

    // Check if the game exists
    const gameExists = await Game.findById(gameId);
    if (!gameExists) {
      return res.status(404).json({ message: 'Game not found.' });
    }

    // بررسی اینکه آیا کاربر قبلاً برای این بازی امتیاز داشته یا نه
    let userScore = await Score.findOne({ user: userId, game: gameId });

    if (userScore) {
      // به‌روزرسانی امتیاز موجود
      await userScore.updateScore(Number(score), Number(playDuration));
      
      res.status(200).json({
        status: 'success',
        message: 'Score updated successfully',
        data: userScore
      });
    } else {
      // ایجاد امتیاز جدید
      const newScore = new Score({
        user: userId,
        game: gameId,
        currentScore: Number(score),
        highestScore: Number(score),
        totalScore: Number(score),
        currentPlayDuration: Number(playDuration),
        totalPlayDuration: Number(playDuration),
        gameSessions: 1,
        recentScores: [{
          score: Number(score),
          playDuration: Number(playDuration),
          playedAt: new Date()
        }]
      });

      await newScore.save();

      res.status(201).json({
        status: 'success',
        message: 'Score created successfully',
        data: newScore
      });
    }

  } catch (error) {
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            errors[key] = error.errors[key].message;
        });
        return res.status(400).json({ message: "Validation Error", errors });
    }
    console.error("Submit Score Error:", error);
    res.status(500).json({ message: 'Server error while submitting score', error: error.message });
  }
};

// Get scores (can be for a specific user or a general leaderboard)
exports.getScores = async (req, res) => {
  try {
    const { userId, gameId, limit = 10, page = 1, sortBy = 'highestScore', order = 'desc' } = req.query;
    const query = {};

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format.' });
      }
      query.user = userId;
    }
    if (gameId) {
      if (!mongoose.Types.ObjectId.isValid(gameId)) {
        return res.status(400).json({ message: 'Invalid game ID format.' });
      }
      query.game = gameId;
    }

    const sortOptions = {};
    if (sortBy === 'highestScore' || sortBy === 'totalScore' || sortBy === 'gameSessions' || sortBy === 'lastPlayedAt') {
        sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    } else {
        sortOptions['highestScore'] = -1; // Default sort
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sortOptions,
      populate: [
        { path: 'user', select: 'username email' },
        { path: 'game', select: 'name imageUrl' }
      ]
    };
    
    const skip = (options.page - 1) * options.limit;

    const scores = await Score.find(query)
                              .sort(options.sort)
                              .skip(skip)
                              .limit(options.limit)
                              .populate(options.populate[0])
                              .populate(options.populate[1]);
    
    const totalScores = await Score.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: scores.length,
      totalResults: totalScores,
      totalPages: Math.ceil(totalScores / options.limit),
      currentPage: options.page,
      data: scores
    });

  } catch (error) {
    console.error("Get Scores Error:", error);
    res.status(500).json({ message: 'Server error while fetching scores', error: error.message });
  }
};

// @desc    Get leaderboard for a game or overall
// @route   GET /api/leaderboard?gameId=<gameId>&limit=<limit>
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const { gameId, limit = 10 } = req.query;

    if (!gameId) {
      return res.status(400).json({ message: 'Game ID (gameId) is required to fetch leaderboard.' });
    }
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        return res.status(400).json({ message: 'Invalid game ID format.' });
    }

    const gameExists = await Game.findById(gameId);
    if (!gameExists) {
        return res.status(404).json({ message: 'Game not found.' });
    }

    const leaderboardLimit = parseInt(limit, 10);

    // دریافت رتبه‌بندی بر اساس بالاترین امتیاز
    const leaderboard = await Score.find({ game: gameId })
      .sort({ highestScore: -1, lastPlayedAt: 1 })
      .limit(leaderboardLimit)
      .populate('user', 'username')
      .select('user highestScore totalScore gameSessions totalPlayDuration lastPlayedAt');

    res.status(200).json({
      status: 'success',
      results: leaderboard.length,
      data: leaderboard.map(s => ({
        userId: s.user._id,
        username: s.user.username,
        highestScore: s.highestScore,
        totalScore: s.totalScore,
        gameSessions: s.gameSessions,
        totalPlayDuration: s.totalPlayDuration,
        lastPlayedAt: s.lastPlayedAt
      }))
    });

  } catch (error) {
    console.error("Get Leaderboard Error:", error);
    res.status(500).json({ message: 'Server error while fetching leaderboard', error: error.message });
  }
};

// GET /api/scores/total-leaderboard?gameId=<gameId>&limit=<limit>
exports.getTotalScoreLeaderboard = async (req, res) => {
  try {
    const { gameId, limit = 10 } = req.query;
    if (!gameId) return res.status(400).json({ message: 'Game ID is required.' });
    if (!mongoose.Types.ObjectId.isValid(gameId)) return res.status(400).json({ message: 'Invalid game ID format.' });

    const leaderboardLimit = parseInt(limit, 10);

    const leaderboard = await Score.find({ game: gameId })
      .sort({ totalScore: -1, lastPlayedAt: 1 })
      .limit(leaderboardLimit)
      .populate('user', 'username')
      .select('user totalScore gameSessions totalPlayDuration highestScore lastPlayedAt');

    res.status(200).json({
      status: 'success',
      results: leaderboard.length,
      data: leaderboard.map(s => ({
        userId: s.user._id,
        username: s.user.username,
        totalScore: s.totalScore,
        gameSessions: s.gameSessions,
        totalPlayDuration: s.totalPlayDuration,
        highestScore: s.highestScore,
        lastPlayedAt: s.lastPlayedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get detailed user statistics for a specific game
// @route   GET /api/scores/user-stats?gameId=<gameId>
// @access  Private (user must be logged in)
exports.getUserStats = async (req, res) => {
  try {
    const { gameId } = req.query;
    const userId = req.user._id;

    if (!gameId) {
      return res.status(400).json({ message: 'Game ID (gameId) is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      return res.status(400).json({ message: 'Invalid game ID format.' });
    }

    const gameExists = await Game.findById(gameId);
    if (!gameExists) {
      return res.status(404).json({ message: 'Game not found.' });
    }

    const userStats = await Score.findOne({ user: userId, game: gameId })
                                .populate('game', 'name imageUrl');

    if (!userStats) {
      return res.status(404).json({ 
        message: 'No statistics found for this user and game.',
        data: {
          currentScore: 0,
          highestScore: 0,
          totalScore: 0,
          currentPlayDuration: 0,
          totalPlayDuration: 0,
          gameSessions: 0,
          recentScores: [],
          lastPlayedAt: null
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: userStats
    });

  } catch (error) {
    console.error("Get User Stats Error:", error);
    res.status(500).json({ message: 'Server error while fetching user stats', error: error.message });
  }
};
