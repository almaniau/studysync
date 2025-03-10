import { Request, Response } from 'express';
import StudyGuide, { IStudyGuide } from '../models/StudyGuide';
import { generateSummary, generateFlashcards, extractKeywords } from '../utils/aiUtils';

// @desc    Get all study guides created by the logged-in user
// @route   GET /api/study-guides/my-guides
// @access  Private
export const getMyStudyGuides = async (req: Request, res: Response) => {
  try {
    const studyGuides = await StudyGuide.find({ creator: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('creator', 'username profilePicture')
      .lean();
    
    res.json(studyGuides);
  } catch (error: any) {
    console.error('Get my study guides error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Create a new study guide
// @route   POST /api/study-guides
// @access  Private
export const createStudyGuide = async (req: Request, res: Response) => {
  try {
    const { title, description, content, subjects, isPublic, customSubject } = req.body;

    // Validate content
    if (!content || content.length < 10) {
      return res.status(400).json({ message: 'Content must be at least 10 characters long' });
    }

    // Create new study guide
    const studyGuide = await StudyGuide.create({
      title,
      description,
      content,
      subjects: customSubject ? [customSubject] : subjects,
      isPublic,
      customSubject,
      creator: req.user._id,
      contributors: [req.user._id]
    });

    // Generate AI content if available
    try {
      // Generate summary
      const summary = await generateSummary(content);
      if (summary) {
        studyGuide.summary = summary;
      }

      // Generate flashcards
      const flashcards = await generateFlashcards(content);
      if (flashcards && flashcards.length > 0) {
        studyGuide.flashcards = flashcards;
      }

      // Extract keywords
      const keywords = await extractKeywords(content);
      if (keywords && keywords.length > 0) {
        studyGuide.keywords = keywords;
      }

      await studyGuide.save();
    } catch (aiError) {
      console.error('AI content generation error:', aiError);
      // Continue without AI-generated content
    }

    // Emit socket event for real-time updates
    req.app.get('io').emit('studyGuide:created', {
      studyGuide: {
        _id: studyGuide._id,
        title: studyGuide.title,
        subjects: studyGuide.subjects,
        creator: req.user._id,
        createdAt: studyGuide.createdAt
      }
    });

    res.status(201).json(studyGuide);
  } catch (error: any) {
    console.error('Create study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all study guides with filtering and pagination
// @route   GET /api/study-guides
// @access  Public
export const getStudyGuides = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter: any = {};
    
    // Filter by subject if provided
    if (req.query.subject) {
      filter.subjects = req.query.subject;
    }
    
    // Search by keyword if provided
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }
    
    // Sort options
    let sort = {};
    if (req.query.sort === 'newest') {
      sort = { createdAt: -1 };
    } else if (req.query.sort === 'oldest') {
      sort = { createdAt: 1 };
    } else if (req.query.sort === 'popular') {
      sort = { upvotes: -1 };
    } else {
      // Default sort by newest
      sort = { createdAt: -1 };
    }
    
    // Execute query with pagination
    const studyGuides = await StudyGuide.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('creator', 'username profilePicture')
      .lean();
    
    // Get total count for pagination
    const total = await StudyGuide.countDocuments(filter);
    
    res.json({
      studyGuides,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error: any) {
    console.error('Get study guides error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get a single study guide by ID
// @route   GET /api/study-guides/:id
// @access  Public
export const getStudyGuideById = async (req: Request, res: Response) => {
  try {
    const studyGuide = await StudyGuide.findById(req.params.id)
      .populate('creator', 'username profilePicture')
      .populate('contributors', 'username profilePicture')
      .populate('versions.updatedBy', 'username profilePicture');
    
    if (studyGuide) {
      res.json(studyGuide);
    } else {
      res.status(404).json({ message: 'Study guide not found' });
    }
  } catch (error: any) {
    console.error('Get study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update a study guide
// @route   PUT /api/study-guides/:id
// @access  Private
export const updateStudyGuide = async (req: Request, res: Response) => {
  try {
    const { title, description, content, subjects, flashcards, isPublic } = req.body;
    const studyGuide = await StudyGuide.findById(req.params.id);
    
    if (!studyGuide) {
      return res.status(404).json({ message: 'Study guide not found' });
    }
    
    // Check if user is creator or contributor
    const isCreator = studyGuide.creator.toString() === req.user._id.toString();
    const isContributor = studyGuide.contributors.some(
      (contributor: any) => contributor.toString() === req.user._id.toString()
    );
    
    if (!isCreator && !isContributor) {
      return res.status(403).json({ message: 'Not authorized to update this study guide' });
    }

    // Validate content if provided
    if (content && content.length < 10) {
      return res.status(400).json({ message: 'Content must be at least 10 characters long' });
    }
    
    // Add user as contributor if not already
    if (!isContributor && !isCreator) {
      studyGuide.contributors.push(req.user._id);
    }
    
    // Check if content has changed significantly
    const hasSignificantChanges = content && (
      !studyGuide.content ||
      Math.abs(studyGuide.content.length - content.length) > 100
    );

    // Generate new AI content if there are significant changes
    if (hasSignificantChanges) {
      try {
        // Generate summary
        const summary = await generateSummary(content);
        if (summary) {
          studyGuide.summary = summary;
        }

        // Generate flashcards if not provided
        if (!flashcards || flashcards.length === 0) {
          const aiFlashcards = await generateFlashcards(content);
          if (aiFlashcards && aiFlashcards.length > 0) {
            studyGuide.flashcards = aiFlashcards;
          }
        }

        // Extract keywords
        const keywords = await extractKeywords(content);
        if (keywords && keywords.length > 0) {
          studyGuide.keywords = keywords;
        }
      } catch (aiError) {
        console.error('AI content generation error:', aiError);
        // Continue without AI-generated content
      }
    }
    
    // Update fields
    studyGuide.title = title || studyGuide.title;
    studyGuide.description = description !== undefined ? description : studyGuide.description;
    studyGuide.content = content || studyGuide.content;
    studyGuide.subjects = subjects || studyGuide.subjects;
    
    // Update flashcards if provided
    if (flashcards) {
      studyGuide.flashcards = flashcards;
    }
    
    // Update privacy setting if provided
    if (isPublic !== undefined) {
      studyGuide.isPublic = isPublic;
    }
    
    const updatedStudyGuide = await studyGuide.save();
    
    // Emit socket event for real-time updates
    req.app.get('io').emit('studyGuide:updated', {
      studyGuideId: updatedStudyGuide._id,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });
    
    res.json(updatedStudyGuide);
  } catch (error: any) {
    console.error('Update study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete a study guide
// @route   DELETE /api/study-guides/:id
// @access  Private
export const deleteStudyGuide = async (req: Request, res: Response) => {
  try {
    const studyGuide = await StudyGuide.findById(req.params.id);
    
    if (!studyGuide) {
      return res.status(404).json({ message: 'Study guide not found' });
    }
    
    // Only creator can delete
    if (studyGuide.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this study guide' });
    }
    
    await studyGuide.deleteOne();
    
    // Emit socket event for real-time updates
    req.app.get('io').emit('studyGuide:deleted', {
      studyGuideId: req.params.id
    });
    
    res.json({ message: 'Study guide removed' });
  } catch (error: any) {
    console.error('Delete study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Upvote a study guide
// @route   PUT /api/study-guides/:id/upvote
// @access  Private
export const upvoteStudyGuide = async (req: Request, res: Response) => {
  try {
    const studyGuide = await StudyGuide.findById(req.params.id);
    
    if (!studyGuide) {
      return res.status(404).json({ message: 'Study guide not found' });
    }
    
    // Check if user already upvoted
    const alreadyUpvoted = studyGuide.upvotedBy.some(
      (userId: any) => userId.toString() === req.user._id.toString()
    );
    
    if (alreadyUpvoted) {
      // Remove upvote
      studyGuide.upvotedBy = studyGuide.upvotedBy.filter(
        (userId: any) => userId.toString() !== req.user._id.toString()
      );
      studyGuide.upvotes = studyGuide.upvotedBy.length;
    } else {
      // Add upvote
      studyGuide.upvotedBy.push(req.user._id);
      studyGuide.upvotes = studyGuide.upvotedBy.length;
    }
    
    await studyGuide.save();
    
    // Emit socket event for real-time updates
    req.app.get('io').emit('studyGuide:upvoted', {
      studyGuideId: studyGuide._id,
      upvotes: studyGuide.upvotes,
      upvotedBy: studyGuide.upvotedBy
    });
    
    res.json({
      upvotes: studyGuide.upvotes,
      upvoted: !alreadyUpvoted
    });
  } catch (error: any) {
    console.error('Upvote study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
