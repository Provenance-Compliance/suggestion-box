import mongoose, { Document, Schema } from 'mongoose';
import './Category'; // Ensure Category model is loaded first

export interface ISuggestion extends Document {
  title: string;
  content: string;
  category: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed';
  isAnonymous: boolean;
  submittedBy?: mongoose.Types.ObjectId;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SuggestionSchema = new Schema<ISuggestion>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed'],
    default: 'pending',
  },
  isAnonymous: {
    type: Boolean,
    default: true,
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

// Clear existing model to force re-compilation with new schema
if (mongoose.models.Suggestion) {
  delete mongoose.models.Suggestion;
}

export default mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
