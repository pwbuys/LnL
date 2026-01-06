import { Injectable, inject } from '@angular/core';
import { MathCard } from '../models/math-card.model';
import { MathStateService } from './math-state.service';

export interface AnswerResult {
  isCorrect: boolean;
  isFast: boolean;
  isSlow: boolean;
  newWeight: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExerciseEngineService {
  private readonly mathStateService = inject(MathStateService);
  private readonly speedThresholdMs = 3000;
  private readonly weightIncreaseOnWrong = 5;
  private readonly weightDecreaseOnMastered = 1;
  private readonly minWeight = 1;

  /**
   * Get the next card using weighted random selection.
   * Cards with higher weights have a higher probability of being selected.
   */
  getNextCard(cards: MathCard[]): MathCard | null {
    if (!cards || cards.length === 0) {
      return null;
    }

    // Calculate total weight
    const totalWeight = cards.reduce((sum, card) => sum + card.weight, 0);

    if (totalWeight === 0) {
      // Fallback to uniform random if all weights are 0
      return cards[Math.floor(Math.random() * cards.length)];
    }

    // Generate random number between 0 and totalWeight
    const random = Math.random() * totalWeight;

    // Find the card using cumulative weight selection
    let cumulativeWeight = 0;
    for (const card of cards) {
      cumulativeWeight += card.weight;
      if (random < cumulativeWeight) {
        return card;
      }
    }

    // Fallback (shouldn't reach here, but just in case)
    return cards[cards.length - 1];
  }

  /**
   * Submit an answer and update card weights based on speed and accuracy.
   * Returns the result of the submission.
   */
  submitAnswer(cardId: string, userAnswer: number, timeTakenMs: number): AnswerResult {
    const card = this.mathStateService.getCardById(cardId);
    if (!card) {
      throw new Error(`Card with id ${cardId} not found`);
    }

    const isCorrect = userAnswer === card.answer;
    const isFast = isCorrect && timeTakenMs < this.speedThresholdMs;
    const isSlow = isCorrect && timeTakenMs >= this.speedThresholdMs;

    let newWeight = card.weight;

    if (!isCorrect) {
      // Wrong answer: increase weight significantly
      newWeight = card.weight + this.weightIncreaseOnWrong;
    } else if (isFast) {
      // Correct and fast: decrease weight (mastered)
      newWeight = Math.max(this.minWeight, card.weight - this.weightDecreaseOnMastered);
    } else if (isSlow) {
      // Correct but slow: slight increase or keep same (needs practice)
      newWeight = card.weight + 1;
    }

    // Update card statistics
    const updatedStats = {
      totalAttempts: card.stats.totalAttempts + 1,
      correctAttempts: isCorrect ? card.stats.correctAttempts + 1 : card.stats.correctAttempts,
      fastAttempts: isFast ? card.stats.fastAttempts + 1 : card.stats.fastAttempts,
      slowAttempts: isSlow ? card.stats.slowAttempts + 1 : card.stats.slowAttempts,
      incorrectAttempts: !isCorrect ? card.stats.incorrectAttempts + 1 : card.stats.incorrectAttempts
    };

    // Update consecutive correct count
    const consecutiveCorrect = isCorrect ? card.consecutiveCorrect + 1 : 0;

    // Update the card in state
    this.mathStateService.updateCard(cardId, {
      weight: newWeight,
      lastDurationMs: timeTakenMs,
      consecutiveCorrect,
      stats: updatedStats
    });

    // Update session statistics
    this.updateSessionStats(isCorrect, isFast, isSlow, timeTakenMs);

    return {
      isCorrect,
      isFast,
      isSlow,
      newWeight
    };
  }

  /**
   * Update session statistics after an answer submission
   */
  private updateSessionStats(
    isCorrect: boolean,
    isFast: boolean,
    isSlow: boolean,
    timeTakenMs: number
  ): void {
    const sessionStats = this.mathStateService.currentSessionStats();
    if (!sessionStats) {
      return;
    }

    const totalQuestions = sessionStats.totalQuestions + 1;
    const correctAnswers = isCorrect ? sessionStats.correctAnswers + 1 : sessionStats.correctAnswers;
    const fastAnswers = isFast ? sessionStats.fastAnswers + 1 : sessionStats.fastAnswers;
    const slowAnswers = isSlow ? sessionStats.slowAnswers + 1 : sessionStats.slowAnswers;
    const incorrectAnswers = !isCorrect
      ? sessionStats.incorrectAnswers + 1
      : sessionStats.incorrectAnswers;

    // Calculate new average time
    const previousTotalTime =
      sessionStats.averageTimeMs * sessionStats.totalQuestions;
    const newAverageTimeMs = (previousTotalTime + timeTakenMs) / totalQuestions;

    this.mathStateService.currentSessionStats.set({
      ...sessionStats,
      totalQuestions,
      correctAnswers,
      fastAnswers,
      slowAnswers,
      incorrectAnswers,
      averageTimeMs: newAverageTimeMs
    });
  }

  /**
   * Get the speed threshold in milliseconds
   */
  getSpeedThresholdMs(): number {
    return this.speedThresholdMs;
  }
}

