import express from 'express';
import {
  createStudyGuide,
  getStudyGuides,
  getStudyGuideById,
  updateStudyGuide,
  deleteStudyGuide,
  upvoteStudyGuide,
  getMyStudyGuides
} from '../controllers/studyGuideController';
import { protect } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/study-guides
// @desc    Get all study guides with filtering and pagination
// @access  Public
router.get('/', getStudyGuides);

// @route   POST /api/study-guides
// @desc    Create a new study guide
// @access  Private
router.post('/', protect, createStudyGuide);

// @route   GET /api/study-guides/my-guides
// @desc    Get all study guides created by the logged-in user
// @access  Private
router.get('/my-guides', protect, getMyStudyGuides);

// @route   GET /api/study-guides/:id
// @desc    Get a single study guide by ID
// @access  Public
router.get('/:id', getStudyGuideById);

// @route   PUT /api/study-guides/:id
// @desc    Update a study guide
// @access  Private
router.put('/:id', protect, updateStudyGuide);

// @route   DELETE /api/study-guides/:id
// @desc    Delete a study guide
// @access  Private
router.delete('/:id', protect, deleteStudyGuide);

// @route   PUT /api/study-guides/:id/upvote
// @desc    Upvote a study guide
// @access  Private
router.put('/:id/upvote', protect, upvoteStudyGuide);

export default router;
