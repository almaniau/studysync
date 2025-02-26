const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudyGuideSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    content: {
      type: String,
      required: true,
      minlength: 10
    },
    summary: {
      type: String,
      default: ''
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    flashcards: [
      {
        question: {
          type: String,
          required: true
        },
        answer: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['multiple_choice', 'freeform'],
          default: 'freeform'
        },
        options: {
          type: [String],
          default: []
        }
      }
    ],
    keywords: [
      {
        word: {
          type: String,
          required: true
        },
        importance: {
          type: Number,
          required: true,
          min: 1,
          max: 10
        }
      }
    ],
    subjects: [
      {
        type: String,
        required: true
      }
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contributors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    upvotes: {
      type: Number,
      default: 0
    },
    upvotedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    versions: [
      {
        content: {
          type: String,
          required: true
        },
        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        updatedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Create text index for search functionality
StudyGuideSchema.index({ title: 'text', content: 'text', subjects: 'text' });

module.exports = mongoose.model('StudyGuide', StudyGuideSchema);
