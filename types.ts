export enum IdeaCategory {
  TECH = 'Technology',
  ART = 'Art',
  LIFE = 'Life',
  SCIENCE = 'Science',
  PHILOSOPHY = 'Philosophy',
  OTHER = 'Other'
}

export interface Idea {
  id: string;
  content: string; // Full content
  shortLabel: string; // First 15 chars
  position: [number, number, number]; // x, y, z
  category: IdeaCategory;
  tags: string[]; // New: 2-3 tags
  size: number; // Represents popularity/focus
  likes: number;
  follows: number;
  createdAt: string;
  aiResponse?: string;
  relatedIds: string[]; // IDs of connected bubbles
  lastAbsorbedAt?: number; // Timestamp for triggering absorb animation
}

export interface GeminiAnalysisResult {
  isDuplicate: boolean;
  existingIdeaId?: string;
  category: IdeaCategory;
  tags?: string[];
  answer: string;
  sentiment?: string;
}