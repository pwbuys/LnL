import { Injectable, signal, effect, inject } from '@angular/core';
import { MathCard, MathSet, SessionStats, SetCard } from '../models/math-card.model';
import { UserProgressService } from './user-progress.service';

const STORAGE_KEY = 'school-helper-math-sets';

@Injectable({
  providedIn: 'root'
})
export class MathStateService {
  private readonly userProgressService = inject(UserProgressService);
  private readonly defaultWeight = 1;

  // Signal-based state management
  // Sets contain only structure (id, question, answer), no progress
  readonly availableSets = signal<MathSet[]>([]);
  readonly currentSet = signal<MathSet | null>(null);
  readonly currentSessionStats = signal<SessionStats | null>(null);

  constructor() {
    // Load from localStorage first, then merge with mock data
    const savedSets = this.loadFromLocalStorage();
    const mockSets = this.createMockSets();

    // Merge: use saved sets if they exist, otherwise use mock sets
    // If saved sets exist, merge unique sets (by id)
    const mergedSets = savedSets.length > 0 ? this.mergeSets(savedSets, mockSets) : mockSets;
    this.availableSets.set(mergedSets);

    // Save to localStorage whenever sets change
    effect(() => {
      const sets = this.availableSets();
      this.saveToLocalStorage(sets);
    });
  }

  /**
   * Load math sets from localStorage
   * Sets are stored with SetCard structure (no progress)
   */
  private loadFromLocalStorage(): MathSet[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored) as Array<Omit<MathSet, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }>;

      // Convert date strings back to Date objects
      // Cards are already SetCard structure (no progress)
      return parsed.map(set => ({
        ...set,
        cards: set.cards as SetCard[],
        createdAt: new Date(set.createdAt),
        updatedAt: new Date(set.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading math sets from localStorage:', error);
      return [];
    }
  }

  /**
   * Save math sets to localStorage
   * Only save SetCard structure (no progress - progress is user-specific)
   */
  private saveToLocalStorage(sets: MathSet[]): void {
    try {
      // Convert Date objects to strings and ensure cards are SetCard structure only
      const serializable = sets.map(set => ({
        id: set.id,
        name: set.name,
        cards: set.cards.map(card => ({
          id: card.id,
          question: card.question,
          answer: card.answer
        })) as SetCard[],
        createdAt: set.createdAt.toISOString(),
        updatedAt: set.updatedAt.toISOString()
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving math sets to localStorage:', error);
    }
  }

  /**
   * Merge saved sets with mock sets, preferring saved sets
   */
  private mergeSets(savedSets: MathSet[], mockSets: MathSet[]): MathSet[] {
    const savedIds = new Set(savedSets.map(s => s.id));
    // Only add mock sets that don't exist in saved sets
    const uniqueMockSets = mockSets.filter(s => !savedIds.has(s.id));
    return [...savedSets, ...uniqueMockSets];
  }

  /**
   * Create mock math sets with multiplication examples
   */
  private createMockSets(): MathSet[] {
    const now = new Date();

    // Multiplication 3s set
    const multiplication3s: SetCard[] = [
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
    const multiplication4s: SetCard[] = [
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
    const multiplication8s: SetCard[] = [
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
   * Create a set card structure (no progress)
   */
  private createCard(id: string, question: string, answer: number): SetCard {
    return {
      id,
      question,
      answer
    };
  }

  /**
   * Merge set card structure with user progress to create MathCard
   */
  private mergeCardWithProgress(setCard: SetCard): MathCard {
    // Read the progress update trigger to make this reactive to progress changes
    this.userProgressService.progressUpdateTrigger();
    
    const progress = this.userProgressService.getCardProgress(setCard.id);
    
    if (progress) {
      return {
        ...setCard,
        weight: progress.weight,
        consecutiveCorrect: progress.consecutiveCorrect,
        lastDurationMs: progress.lastDurationMs,
        stats: progress.stats
      };
    }

    // No progress yet, return card with defaults
    return {
      ...setCard,
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
   * Get cards for a set with user progress merged
   */
  getCardsWithProgress(set: MathSet): MathCard[] {
    return set.cards.map(card => this.mergeCardWithProgress(card));
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
   * Get a card by ID from the current set with user progress merged
   */
  getCardById(cardId: string): MathCard | undefined {
    const set = this.currentSet();
    if (!set) {
      return undefined;
    }

    const setCard = set.cards.find(card => card.id === cardId);
    if (!setCard) {
      return undefined;
    }

    return this.mergeCardWithProgress(setCard);
  }

  /**
   * Update a card's progress (user-specific)
   */
  updateCard(cardId: string, updates: Partial<MathCard>): void {
    // Save progress to user progress service
    this.userProgressService.updateCardProgress(cardId, {
      weight: updates.weight,
      consecutiveCorrect: updates.consecutiveCorrect,
      lastDurationMs: updates.lastDurationMs,
      stats: updates.stats
    });
  }

  /**
   * Add a new math set (used by Set Creator)
   */
  addSet(newSet: MathSet): void {
    const currentSets = this.availableSets();
    this.availableSets.set([...currentSets, newSet]);
  }

  /**
   * Update an existing math set
   */
  updateSet(setId: string, updates: Partial<MathSet>): void {
    const currentSets = this.availableSets();
    const updatedSets = currentSets.map(set => {
      if (set.id === setId) {
        return {
          ...set,
          ...updates,
          updatedAt: new Date()
        };
      }
      return set;
    });
    this.availableSets.set(updatedSets);

    // If the updated set was the current set, update it
    const currentSet = this.currentSet();
    if (currentSet && currentSet.id === setId) {
      const updatedSet = updatedSets.find(s => s.id === setId);
      if (updatedSet) {
        this.currentSet.set(updatedSet);
      }
    }
  }

  /**
   * Get a set by ID
   */
  getSetById(setId: string): MathSet | undefined {
    return this.availableSets().find(set => set.id === setId);
  }

  /**
   * Delete a math set by ID
   */
  deleteSet(setId: string): void {
    const currentSets = this.availableSets();
    const filteredSets = currentSets.filter(set => set.id !== setId);
    this.availableSets.set(filteredSets);

    // If the deleted set was the current set, clear it
    const currentSet = this.currentSet();
    if (currentSet && currentSet.id === setId) {
      this.currentSet.set(null);
    }
  }

  /**
   * Reset progress for all cards in a set
   */
  resetSetProgress(setId: string): void {
    const set = this.getSetById(setId);
    if (!set) {
      return;
    }

    // Get all card IDs from the set
    const cardIds = set.cards.map(card => card.id);
    
    // Reset progress for all cards in the set
    this.userProgressService.resetSetProgress(cardIds);
  }
}

