const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as necessary
const { verifyToken } = require('../utils/jwt'); // Adjust path as necessary

exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Else, if token is in cookies (optional, but good for web)
  // else if (req.cookies && req.cookies.token) {
  //   token = req.cookies.token;
  // }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Not authorized, token failed verification' });
    }

    // Get user from the token's ID, excluding password
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
        return res.status(401).json({ message: 'User not found for this token' });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Token verification error:', error);
    // Differentiate between expired token and other errors if needed
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired' });
    }
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Middleware to restrict access to certain roles (e.g., 'admin')
// To be used after 'protect' middleware
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) { // Assuming user model has a 'role' field
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

// Note: The User model currently does not have a 'role' field.
// This needs to be added to the User model if restrictTo is to be used.
// Example in User.js schema:
// role: {
//   type: String,
//   enum: ['user', 'admin'],
//   default: 'user'
// }
