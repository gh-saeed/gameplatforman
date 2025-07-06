const Game = require('../../models/Game');

// Create a new game (Admin functionality, protection to be added later)
exports.addGame = async (req, res) => {
  try {
    const { name, description, imageUrl, gameUrl } = req.body;

    if (!name || !description || !imageUrl || !gameUrl) {
      return res.status(400).json({ message: 'Please provide name, description, imageUrl, and gameUrl for the game.' });
    }

    // Check if a game with the same name or gameUrl already exists
    const existingGameByName = await Game.findOne({ name });
    if (existingGameByName) {
      return res.status(400).json({ message: 'A game with this name already exists.' });
    }
    // Optional: Check for unique gameUrl if necessary, though multiple entries might point to same CDN for different versions/regions
    // const existingGameByUrl = await Game.findOne({ gameUrl });
    // if (existingGameByUrl) {
    //   return res.status(400).json({ message: 'This game URL is already in use.' });
    // }

    const newGame = new Game({
      name,
      description,
      imageUrl,
      gameUrl
    });

    await newGame.save();

    res.status(201).json({
      status: 'success',
      message: 'Game added successfully',
      data: newGame
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            errors[key] = error.errors[key].message;
        });
        return res.status(400).json({ message: "Validation Error", errors });
    }
    console.error("Add Game Error:", error);
    res.status(500).json({ message: 'Server error while adding game', error: error.message });
  }
};

// Get all games
exports.getAllGames = async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      status: 'success',
      results: games.length,
      data: games
    });

  } catch (error) {
    console.error("Get All Games Error:", error);
    res.status(500).json({ message: 'Server error while fetching games', error: error.message });
  }
};

// Get a single game by ID (useful for game page or admin edit)
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    res.status(200).json({
      status: 'success',
      data: game
    });
  } catch (error) {
    console.error("Get Game By ID Error:", error);
    if (error.kind === 'ObjectId') { // Handle invalid MongoDB ObjectId format
        return res.status(400).json({ message: 'Invalid game ID format' });
    }
    res.status(500).json({ message: 'Server error while fetching game', error: error.message });
  }
};

// TODO: Add updateGame and deleteGame controllers for admin later
// exports.updateGame = async (req, res) => { ... }
// exports.deleteGame = async (req, res) => { ... }
