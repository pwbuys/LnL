import { Injectable, inject } from '@angular/core';
import { MathCard } from '../models/math-card.model';
import { MathStateService } from './math-state.service';
import { MathSettingsService } from './math-settings.service';

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
  private readonly settingsService = inject(MathSettingsService);
  private readonly weightIncreaseOnWrong = 5;
  private readonly weightDecreaseOnMastered = 1;
  private readonly minWeight = 1;
  private readonly maxWeight = 7;

  /**
   * Get the next card using weighted random selection.
   * Cards with higher weights have a higher probability of being selected.
   * @param cards - Array of available cards (with user progress merged)
   * @param excludeCardId - Optional card ID to exclude from selection (prevents same question twice in a row)
   */
  getNextCard(cards: MathCard[], excludeCardId?: string): MathCard | null {
    if (!cards || cards.length === 0) {
      return null;
    }

    // Filter out the excluded card if provided
    const availableCards = excludeCardId
      ? cards.filter(card => card.id !== excludeCardId)
      : cards;

    // If no cards available after filtering, allow the excluded card (edge case: only one card)
    const cardsToUse = availableCards.length > 0 ? availableCards : cards;

    // Calculate total weight
    const totalWeight = cardsToUse.reduce((sum, card) => sum + card.weight, 0);

    if (totalWeight === 0) {
      // Fallback to uniform random if all weights are 0
      return cardsToUse[Math.floor(Math.random() * cardsToUse.length)];
    }

    // Generate random number between 0 and totalWeight
    const random = Math.random() * totalWeight;

    // Find the card using cumulative weight selection
    let cumulativeWeight = 0;
    for (const card of cardsToUse) {
      cumulativeWeight += card.weight;
      if (random < cumulativeWeight) {
        return card;
      }
    }

    // Fallback (shouldn't reach here, but just in case)
    return cardsToUse[cardsToUse.length - 1];
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

    const speedThreshold = this.settingsService.speedThresholdMs();
    const isCorrect = userAnswer === card.answer;
    const isFast = isCorrect && timeTakenMs < speedThreshold;
    const isSlow = isCorrect && timeTakenMs >= speedThreshold;

    let newWeight = card.weight;

    if (!isCorrect) {
      // Wrong answer: increase weight significantly
      newWeight = card.weight + this.weightIncreaseOnWrong;
    } else if (isFast) {
      // Correct and fast: decrease weight (mastered)
      newWeight = card.weight - this.weightDecreaseOnMastered;
    } else if (isSlow) {
      // Correct but slow: slight increase or keep same (needs practice)
      newWeight = card.weight + 1;
    }

    // Clamp weight between min and max
    newWeight = Math.max(this.minWeight, Math.min(this.maxWeight, newWeight));

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
    return this.settingsService.speedThresholdMs();
  }
}

