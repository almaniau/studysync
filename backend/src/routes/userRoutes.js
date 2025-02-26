const express = require('express');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController.js');
const { protect } = require('../middleware/auth.js');

const router = express.Router();

// Register a new user
router.post('/', registerUser);

// Authenticate user & get token
router.post('/login', loginUser);

// Get user profile (protected route)
router.get('/profile', protect, getUserProfile);

// Update user profile (protected route)
router.put('/profile', protect, updateUserProfile);

module.exports = router;
