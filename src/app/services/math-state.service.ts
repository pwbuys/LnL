import { Injectable, signal } from '@angular/core';
import { MathCard, MathSet, SessionStats } from '../models/math-card.model';

@Injectable({
  providedIn: 'root'
})
export class MathStateService {
  private readonly defaultWeight = 1;

  // Signal-based state management
  readonly availableSets = signal<MathSet[]>([]);
  readonly currentSet = signal<MathSet | null>(null);
  readonly currentSessionStats = signal<SessionStats | null>(null);

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize the service with mock multiplication data
   */
  initializeMockData(): void {
    const mockSets = this.createMockSets();
    this.availableSets.set(mockSets);
  }

  /**
   * Create mock math sets with multiplication examples
   */
  private createMockSets(): MathSet[] {
    const now = new Date();

    // Multiplication 3s set
    const multiplication3s: MathCard[] = [
      this.createCard('3x1', '3 x 1', 3),
      this.createCard('3x2', '3 x 2', 6),
      this.createCard('3x3', '3 x 3', 9),
      this.createCard('3x4', '3 x 4', 12),
      this.createCard('3x5', '3 x 5', 15),
      this.createCard('3x6', '3 x 6', 18),
      this.createCard('3x7', '3 x 7', 21),
      this.createCard('3x8', '3 x 8', 24),
      this.createCard('3x9', '3 x 9', 27),
      this.createCard('3x10', '3 x 10', 30)
    ];

    // Multiplication 4s set
    const multiplication4s: MathCard[] = [
      this.createCard('4x1', '4 x 1', 4),
      this.createCard('4x2', '4 x 2', 8),
      this.createCard('4x3', '4 x 3', 12),
      this.createCard('4x4', '4 x 4', 16),
      this.createCard('4x5', '4 x 5', 20),
      this.createCard('4x6', '4 x 6', 24),
      this.createCard('4x7', '4 x 7', 28),
      this.createCard('4x8', '4 x 8', 32),
      this.createCard('4x9', '4 x 9', 36),
      this.createCard('4x10', '4 x 10', 40)
    ];

    // Multiplication 8s set
    const multiplication8s: MathCard[] = [
      this.createCard('8x1', '8 x 1', 8),
      this.createCard('8x2', '8 x 2', 16),
      this.createCard('8x3', '8 x 3', 24),
      this.createCard('8x4', '8 x 4', 32),
      this.createCard('8x5', '8 x 5', 40),
      this.createCard('8x6', '8 x 6', 48),
      this.createCard('8x7', '8 x 7', 56),
      this.createCard('8x8', '8 x 8', 64),
      this.createCard('8x9', '8 x 9', 72),
      this.createCard('8x10', '8 x 10', 80)
    ];

    return [
      {
        id: 'mult-3s',
        name: 'Multiplication 3s',
        cards: multiplication3s,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mult-4s',
        name: 'Multiplication 4s',
        cards: multiplication4s,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'mult-8s',
        name: 'Multiplication 8s',
        cards: multiplication8s,
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  /**
   * Create a math card with default values
   */
  private createCard(id: string, question: string, answer: number): MathCard {
    return {
      id,
      question,
      answer,
      weight: this.defaultWeight,
      consecutiveCorrect: 0,
      stats: {
        totalAttempts: 0,
        correctAttempts: 0,
        fastAttempts: 0,
        slowAttempts: 0,
        incorrectAttempts: 0
      }
    };
  }

  /**
   * Set the current active math set
   */
  setCurrentSet(setId: string): void {
    const set = this.availableSets().find(s => s.id === setId);
    if (set) {
      this.currentSet.set(set);
    }
  }

  /**
   * Clear the current set
   */
  clearCurrentSet(): void {
    this.currentSet.set(null);
  }

  /**
   * Start a new session
   */
  startSession(): void {
    const set = this.currentSet();
    if (!set) {
      return;
    }

    const sessionStats: SessionStats = {
      startTime: new Date(),
      totalQuestions: 0,
      correctAnswers: 0,
      fastAnswers: 0,
      slowAnswers: 0,
      incorrectAnswers: 0,
      averageTimeMs: 0
    };

    this.currentSessionStats.set(sessionStats);
  }

  /**
   * End the current session
   */
  endSession(): void {
    const stats = this.currentSessionStats();
    if (stats) {
      this.currentSessionStats.set({
        ...stats,
        endTime: new Date()
      });
    }
  }

  /**
   * Get a card by ID from the current set
   */
  getCardById(cardId: string): MathCard | undefined {
    const set = this.currentSet();
    return set?.cards.find(card => card.id === cardId);
  }

  /**
   * Update a card in the current set
   */
  updateCard(cardId: string, updates: Partial<MathCard>): void {
    const set = this.currentSet();
    if (!set) {
      return;
    }

    const updatedCards = set.cards.map(card => {
      if (card.id === cardId) {
        return { ...card, ...updates };
      }
      return card;
    });

    const updatedSet: MathSet = {
      ...set,
      cards: updatedCards,
      updatedAt: new Date()
    };

    this.currentSet.set(updatedSet);

    // Also update in availableSets
    const updatedAvailableSets = this.availableSets().map(s => {
      if (s.id === set.id) {
        return updatedSet;
      }
      return s;
    });

    this.availableSets.set(updatedAvailableSets);
  }
}

