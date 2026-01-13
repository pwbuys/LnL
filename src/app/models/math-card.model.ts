export interface MathCard {
  id: string;
  question: string;
  answer: number;
  weight: number;
  lastDurationMs?: number;
  consecutiveCorrect: number;
  stats: CardStats;
}

export interface CardStats {
  totalAttempts: number;
  correctAttempts: number;
  fastAttempts: number; // Answers within target time
  slowAttempts: number; // Correct but too slow
  incorrectAttempts: number;
}

/**
 * Set card structure (shared, no progress)
 * Used for storage - progress is user-specific
 */
export interface SetCard {
  id: string;
  question: string;
  answer: number;
}

export interface MathSet {
  id: string;
  name: string;
  cards: SetCard[]; // Structure only, progress is user-specific
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionStats {
  startTime: Date;
  endTime?: Date;
  totalQuestions: number;
  correctAnswers: number;
  fastAnswers: number;
  slowAnswers: number;
  incorrectAnswers: number;
  averageTimeMs: number;
}

