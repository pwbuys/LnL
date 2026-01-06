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

export interface MathSet {
  id: string;
  name: string;
  cards: MathCard[];
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

