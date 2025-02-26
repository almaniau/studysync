const StudyGuide = require('../models/StudyGuide.js');
const { generateSummary, generateFlashcards, extractKeywords } = require('../utils/aiUtils.js');

// @desc    Get all study guides created by the logged-in user
// @route   GET /api/study-guides/my-guides
// @access  Private
exports.getMyStudyGuides = async (req, res) => {
  try {
    const studyGuides = await StudyGuide.find({ creator: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('creator', 'username profilePicture')
      .lean();
    
    res.json(studyGuides);
  } catch (error) {
    console.error('Get my study guides error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Create a new study guide
// @route   POST /api/study-guides
// @access  Private
exports.createStudyGuide = async (req, res) => {
  try {
    const { title, content, subjects } = req.body;

    // Create new study guide
    const studyGuide = await StudyGuide.create({
      title,
      content,
      subjects,
      creator: req.user._id,
      contributors: [req.user._id]
    });

    // Generate AI summary, flashcards, and keywords if content is long enough
    if (content.length > 200) {
      try {
        // Generate summary using Claude API
        const summary = await generateSummary(content);
        
        // Generate flashcards using Claude API
        const flashcards = await generateFlashcards(content);
        
        // Extract keywords using Claude API
        const keywords = await extractKeywords(content);
        
        // Update study guide with AI-generated content
        studyGuide.summary = summary;
        studyGuide.flashcards = flashcards;
        studyGuide.keywords = keywords;
        await studyGuide.save();
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        // Continue without AI features if there's an error
      }
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
  } catch (error) {
    console.error('Create study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all study guides with filtering and pagination
// @route   GET /api/study-guides
// @access  Public
exports.getStudyGuides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Filter by subject if provided
    if (req.query.subject) {
      filter.subjects = req.query.subject;
    }
    
    // Search by keyword if provided
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
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
  } catch (error) {
    console.error('Get study guides error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get a single study guide by ID
// @route   GET /api/study-guides/:id
// @access  Public
exports.getStudyGuideById = async (req, res) => {
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
  } catch (error) {
    console.error('Get study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update a study guide
// @route   PUT /api/study-guides/:id
// @access  Private
exports.updateStudyGuide = async (req, res) => {
  try {
    const { title, content, subjects, flashcards, isPublic } = req.body;
    const studyGuide = await StudyGuide.findById(req.params.id);
    
    if (!studyGuide) {
      return res.status(404).json({ message: 'Study guide not found' });
    }
    
    // Check if user is creator or contributor
    const isCreator = studyGuide.creator.toString() === req.user._id.toString();
    const isContributor = studyGuide.contributors.some(
      (contributor) => contributor.toString() === req.user._id.toString()
    );
    
    if (!isCreator && !isContributor) {
      return res.status(403).json({ message: 'Not authorized to update this study guide' });
    }
    
    // Save previous version
    if (studyGuide.content !== content) {
      studyGuide.versions = studyGuide.versions || [];
      studyGuide.versions.push({
        content: studyGuide.content,
        updatedBy: req.user._id,
        updatedAt: new Date()
      });
      
      // Add user as contributor if not already
      if (!isContributor && !isCreator) {
        studyGuide.contributors.push(req.user._id);
      }
      
      // Generate new AI summary, flashcards, and keywords if content changed significantly
      if (Math.abs(studyGuide.content.length - content.length) > 100) {
        try {
          // Generate summary using Claude API
          const summary = await generateSummary(content);
          
          // Generate flashcards using Claude API
          const aiFlashcards = await generateFlashcards(content);
          
          // Extract keywords using Claude API
          const keywords = await extractKeywords(content);
          
          // Update study guide with AI-generated content
          studyGuide.summary = summary;
          // Only update AI-generated flashcards if user hasn't provided custom ones
          if (!flashcards || flashcards.length === 0) {
            studyGuide.flashcards = aiFlashcards;
          }
          studyGuide.keywords = keywords;
        } catch (aiError) {
          console.error('AI processing error:', aiError);
          // Continue without updating AI features if there's an error
        }
      }
    }
    
    // Update fields
    studyGuide.title = title || studyGuide.title;
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
  } catch (error) {
    console.error('Update study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete a study guide
// @route   DELETE /api/study-guides/:id
// @access  Private
exports.deleteStudyGuide = async (req, res) => {
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
  } catch (error) {
    console.error('Delete study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Upvote a study guide
// @route   PUT /api/study-guides/:id/upvote
// @access  Private
exports.upvoteStudyGuide = async (req, res) => {
  try {
    const studyGuide = await StudyGuide.findById(req.params.id);
    
    if (!studyGuide) {
      return res.status(404).json({ message: 'Study guide not found' });
    }
    
    // Check if user already upvoted
    const alreadyUpvoted = studyGuide.upvotedBy.some(
      (userId) => userId.toString() === req.user._id.toString()
    );
    
    if (alreadyUpvoted) {
      // Remove upvote
      studyGuide.upvotedBy = studyGuide.upvotedBy.filter(
        (userId) => userId.toString() !== req.user._id.toString()
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
  } catch (error) {
    console.error('Upvote study guide error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};
