const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Game name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Game description is required'],
    trim: true
  },
  imageUrl: { // URL to the game's promotional image/icon
    type: String,
    required: [true, 'Game image URL is required'],
    trim: true
  },
  gameUrl: { // URL to the game's HTML file or CDN link
    type: String,
    required: [true, 'Game URL is required'],
    trim: true
  },
  // Possible future fields:
  // genre: String,
  // tags: [String],
  // developer: String,
  // releaseDate: Date,
  // version: String,
  // isActive: { type: Boolean, default: true }
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update `updatedAt` timestamp before saving
gameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
