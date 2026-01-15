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
  mode?: ExerciseMode;
  timedDuration?: TimedDuration;
  level?: LevelId;
}

// Exercise mode types
export type ExerciseMode = 'master' | 'timed';
export type TimedDuration = 30 | 60 | 90;
export type LevelId = 'level1' | 'level2' | 'level3' | 'ninja';

export interface Level {
  id: LevelId;
  name: string;
  speedThresholdMs: number;
}

export const LEVELS: Level[] = [
  { id: 'level1', name: 'Level 1', speedThresholdMs: 10000 },
  { id: 'level2', name: 'Level 2', speedThresholdMs: 6000 },
  { id: 'level3', name: 'Level 3', speedThresholdMs: 3000 },
  { id: 'ninja', name: 'Ninja', speedThresholdMs: 1500 },
];

export function getLevelById(id: LevelId): Level {
  return LEVELS.find(l => l.id === id) ?? LEVELS[0];
}

