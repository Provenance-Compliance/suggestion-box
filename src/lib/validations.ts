import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

export const suggestionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content must be less than 2000 characters'),
  category: z.string().min(1, 'Category is required'),
  isAnonymous: z.boolean(),
});

export const updateSuggestionSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'in-progress', 'completed']).optional(),
  adminNotes: z.string().max(1000, 'Admin notes must be less than 1000 characters').optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type SuggestionFormData = z.infer<typeof suggestionSchema>;
export type UpdateSuggestionFormData = z.infer<typeof updateSuggestionSchema>;
