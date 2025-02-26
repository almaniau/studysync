import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Register a new user
router.post('/', function(req, res) {
  return registerUser(req, res);
});

// Authenticate user & get token
router.post('/login', function(req, res) {
  return loginUser(req, res);
});

// Get user profile (protected route)
router.get('/profile', protect, function(req, res) {
  return getUserProfile(req, res);
});

// Update user profile (protected route)
router.put('/profile', protect, function(req, res) {
  return updateUserProfile(req, res);
});

export default router;
