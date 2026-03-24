const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1hr' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required' });

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing)
      return res.status(409).json({ message: 'Username already taken' });

    const user = await User.create({ username, password });
    const token = signToken(user._id);

    res.status(201).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password are required' });

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: 'Wrong username or password' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ message: 'Wrong username or password' });

    const token = signToken(user._id);
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
