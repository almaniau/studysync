import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} from '../controllers/userController';
import { protect } from '../middleware/auth';

// Create router
const router = express.Router();

// Register a new user
router.post('/', registerUser);

// Authenticate user & get token
router.post('/login', loginUser);

// Get user profile (protected route)
router.get('/profile', protect, getUserProfile);

// Update user profile (protected route)
router.put('/profile', protect, updateUserProfile);

export default router;
