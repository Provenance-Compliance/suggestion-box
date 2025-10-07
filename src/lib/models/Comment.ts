import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  suggestion: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  isInternal: boolean; // For internal admin notes vs public responses
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  suggestion: {
    type: Schema.Types.ObjectId,
    ref: 'Suggestion',
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  isInternal: {
    type: Boolean,
    default: false, // Default to public comments
  },
}, {
  timestamps: true,
});

// Prevent re-compilation during development
export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
