require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static('public')); // Serve static files from 'public' directory

// Basic Route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
app.get('/admin',(req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
})
app.get('/profile',(req, res) => {
  res.sendFile(__dirname + '/public/profile.html');
})
app.get('/leaderboard',(req, res) => {
  res.sendFile(__dirname + '/public/leaderboard.html');
})
app.get('/game',(req, res) => {
  res.sendFile(__dirname + '/public/game.html');
})
app.get('/test',(req, res) => {
  res.sendFile(__dirname + '/public/test-platform.html');
})
app.get('/test-sonic',(req, res) => {
  res.sendFile(__dirname + '/public/test-sonic.html');
})
app.get('/test-sonic-integrated',(req, res) => {
  res.sendFile(__dirname + '/public/test-sonic-integrated.html');
})

// API Routes
const authRoutes = require('./src/api/routes/authRoutes');
const gameRoutes = require('./src/api/routes/gameRoutes');
const scoreRoutes = require('./src/api/routes/scoreRoutes');
const userRoutes = require('./src/api/routes/userRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api', userRoutes); // This will prefix /profile with /api, so /api/profile


// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/game_platform';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1); // Exit process with failure
  });

// Global error handler (optional, can be more specific later)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
