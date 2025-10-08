import mongoose, { Document, Schema } from 'mongoose';
import './User'; // Ensure User model is loaded
import './Suggestion'; // Ensure Suggestion model is loaded

export interface IUpvote extends Document {
  suggestion: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UpvoteSchema = new Schema<IUpvote>({
  suggestion: {
    type: Schema.Types.ObjectId,
    ref: 'Suggestion',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Create compound index to ensure one upvote per user per suggestion
UpvoteSchema.index({ suggestion: 1, user: 1 }, { unique: true });

export default mongoose.models.Upvote || mongoose.model<IUpvote>('Upvote', UpvoteSchema);
