const User = require('../../models/User');
const Score = require('../../models/Score');
const mongoose = require('mongoose');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Aggregate scores for the user
    const userStats = await Score.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(req.user.id) }
      },
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' },
          totalPlayDuration: { $sum: '$playDuration' }, // in seconds
          gamesPlayedCount: { $addToSet: '$game' } // Counts unique games
        }
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from stats
          totalScore: 1,
          totalPlayDuration: 1,
          uniqueGamesPlayed: { $size: '$gamesPlayedCount' }
        }
      }
    ]);

    // userStats will be an array, potentially empty if no scores
    const stats = userStats.length > 0 ? userStats[0] : {
      totalScore: 0,
      totalPlayDuration: 0,
      uniqueGamesPlayed: 0
    };

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          createdAt: user.createdAt
        },
        stats: stats
      }
    });

  } catch (error) {
    console.error('Get User Profile Error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile', error: error.message });
  }
};

// In the future, we can add:
// - Get user's detailed game history (paginated list of scores)
// - Update user profile (e.g., change password, update details - needs careful consideration for security)
