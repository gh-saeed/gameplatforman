const User = require('../../models/User');
const { generateToken } = require('../../utils/jwt');

// Signup new user
exports.signup = async (req, res) => {
  try {
    const { username, mobile, email, password } = req.body;

    // Basic validation (more comprehensive validation can be added)
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username, mobile, email, and password' });
    }

    // Check if user already exists (username, email, mobile should be unique)
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    const existingUserByMobile = await User.findOne({ mobile });
    if (existingUserByMobile) {
      return res.status(400).json({ message: 'Mobile number already in use' });
    }

    const newUser = new User({
      username,
      mobile,
      email,
      password
    });

    // Check if this user should be an admin
    if (process.env.ADMIN_EMAIL && newUser.email === process.env.ADMIN_EMAIL) {
      newUser.role = 'admin';
    }

    await newUser.save();

    const token = generateToken(newUser._id);

    // For security, don't send password back, even hashed, unless explicitly needed.
    // newUser.password = undefined; // Mongoose 'select: false' handles this for queries

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role // Ensure role is sent
      }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
        let errors = {};
        Object.keys(error.errors).forEach((key) => {
            errors[key] = error.errors[key].message;
        });
        return res.status(400).json({ message: "Validation Error", errors });
    }
    console.error("Signup Error:", error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// Login existing user
exports.login = async (req, res) => {
  try {
    const { loginIdentifier, password } = req.body; // loginIdentifier can be email, username, or mobile

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Please provide login identifier (email/username/mobile) and password' });
    }

    // Find user by email, username, or mobile
    // Also, ensure password field is selected as it's typically excluded
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier },
        { mobile: loginIdentifier }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials (user not found)' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials (password incorrect)' });
    }

    const token = generateToken(user._id);

    // For security, don't send password back
    // user.password = undefined; // Mongoose 'select: false' handles this for queries

    res.status(200).json({
      status: 'success',
      message: 'User logged in successfully',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        role: user.role // Ensure role is sent
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// TODO: Implement OTP logic later if required by plan
// exports.sendOtp = async (req, res) => { ... }
// exports.verifyOtp = async (req, res) => { ... }
