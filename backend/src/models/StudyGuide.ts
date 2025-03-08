import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFlashcard {
  _id: Types.ObjectId;
  question: string; 
  answer: string; 
  type: 'multiple_choice' | 'freeform';
  options?: string[];
  correctOptionIndex?: number;
}

export interface IStudyGuide extends Document {
  title: string;
  description?: string;
  content: string;
  summary?: string;
  flashcards?: Array<IFlashcard>;
  keywords?: Array<{ word: string; importance: number }>;
  subjects: string[];
  creator: mongoose.Types.ObjectId;
  contributors: mongoose.Types.ObjectId[];
  upvotes: number;
  upvotedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  customSubject?: string;
}

const StudyGuideSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true
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
    customSubject: {
      type: String,
      trim: true
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
        },
        correctOptionIndex: {
          type: Number,
          default: 0
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
    ]
  },
  {
    timestamps: true
  }
);

// Create text index for search functionality
StudyGuideSchema.index({ 
  title: 'text', 
  content: 'text',
  subjects: 'text' 
});

export default mongoose.model<IStudyGuide>('StudyGuide', StudyGuideSchema);
