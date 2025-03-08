import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../middleware/auth';
import StudyGuide from '../models/StudyGuide';

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password
    }) as IUser;

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id.toString())
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }) as IUser | null;

    // Check if user exists and password matches
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id.toString())
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id) as IUser | null;

    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id) as IUser | null;

    if (user) {
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.profilePicture = req.body.profilePicture || user.profilePicture;
      user.bio = req.body.bio || user.bio;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        bio: updatedUser.bio,
        token: generateToken(updatedUser._id.toString())
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/users/account
// @access  Private
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Delete all study guides created by the user
    await StudyGuide.deleteMany({ creator: userId });

    // Remove user from contributors of other study guides
    await StudyGuide.updateMany(
      { contributors: userId },
      { $pull: { contributors: userId } }
    );

    // Remove user's upvotes from study guides
    await StudyGuide.updateMany(
      { upvotedBy: userId },
      { 
        $pull: { upvotedBy: userId },
        $inc: { upvotes: -1 }
      }
    );

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Reset all user data
// @route   POST /api/users/reset-data
// @access  Private
export const resetUserData = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Delete all study guides created by the user
    await StudyGuide.deleteMany({ creator: userId });

    // Remove user from contributors of other study guides
    await StudyGuide.updateMany(
      { contributors: userId },
      { $pull: { contributors: userId } }
    );

    // Remove user's upvotes from study guides
    await StudyGuide.updateMany(
      { upvotedBy: userId },
      { 
        $pull: { upvotedBy: userId },
        $inc: { upvotes: -1 }
      }
    );

    // Reset user settings to default (but keep account)
    const user = await User.findById(userId);
    if (user) {
      user.settings = {
        emailNotifications: true,
        studyReminders: true,
        privacySettings: {
          profileVisibility: 'public',
          showActivity: true,
          showStudyGuides: true
        },
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
          reducedMotion: false
        },
        language: 'en'
      };
      await user.save();
    }

    res.json({ message: 'All user data has been reset successfully' });
  } catch (error: any) {
    console.error('Reset data error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
