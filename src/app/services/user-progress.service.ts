import { Injectable, inject, effect, signal } from '@angular/core';
import { UserService } from './user.service';
import { MathCard } from '../models/math-card.model';

const STORAGE_PREFIX = 'school-helper-user-';
const STORAGE_SUFFIX_PROGRESS = '-progress';

export interface UserCardProgress {
  weight: number;
  consecutiveCorrect: number;
  lastDurationMs?: number;
  stats: {
    totalAttempts: number;
    correctAttempts: number;
    fastAttempts: number;
    slowAttempts: number;
    incorrectAttempts: number;
  };
}

export type UserProgress = Record<string, UserCardProgress>;

@Injectable({
  providedIn: 'root'
})
export class UserProgressService {
  private readonly userService = inject(UserService);
  private readonly progressCache = new Map<string, UserProgress>();
  // Signal that updates whenever progress changes, used to trigger computed recalculations
  readonly progressUpdateTrigger = signal<number>(0);

  constructor() {
    // Migrate existing data on first load
    this.migrateExistingData();

    // Clear cache when user changes
    effect(() => {
      const currentUser = this.userService.currentUser();
      if (currentUser) {
        // Preload progress for current user
        this.loadProgressForUser(currentUser);
      }
    });
  }

  /**
   * Migrate existing single-user data to multi-user format
   * This handles backward compatibility for existing installations
   */
  private migrateExistingData(): void {
    const MIGRATION_KEY = 'school-helper-migration-completed';
    
    // Check if migration has already been completed
    if (localStorage.getItem(MIGRATION_KEY)) {
      return;
    }

    try {
      // Check if old format data exists (sets with progress in cards)
      const oldSetsKey = 'school-helper-math-sets';
      const oldSetsData = localStorage.getItem(oldSetsKey);
      
      if (oldSetsData) {
        const parsed = JSON.parse(oldSetsData);
        
        // Check if sets contain cards with progress (old format)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstSet = parsed[0];
          if (firstSet.cards && Array.isArray(firstSet.cards) && firstSet.cards.length > 0) {
            const firstCard = firstSet.cards[0];
            // Check if card has progress fields (old format)
            if (firstCard.weight !== undefined || firstCard.stats !== undefined) {
              // Migrate progress to default user
              const defaultUser = 'Default';
              const migratedProgress: UserProgress = {};

              // Extract progress from all sets
              for (const set of parsed) {
                if (set.cards && Array.isArray(set.cards)) {
                  for (const card of set.cards) {
                    if (card.id && (card.weight !== undefined || card.stats !== undefined)) {
                      migratedProgress[card.id] = {
                        weight: card.weight ?? 1,
                        consecutiveCorrect: card.consecutiveCorrect ?? 0,
                        lastDurationMs: card.lastDurationMs,
                        stats: card.stats ?? {
                          totalAttempts: 0,
                          correctAttempts: 0,
                          fastAttempts: 0,
                          slowAttempts: 0,
                          incorrectAttempts: 0
                        }
                      };
                    }
                  }
                }
              }

              // Save migrated progress
              if (Object.keys(migratedProgress).length > 0) {
                this.saveProgressForUser(defaultUser, migratedProgress);
              }

              // Clean up sets (remove progress, keep only structure)
              const cleanedSets = parsed.map((set: any) => ({
                id: set.id,
                name: set.name,
                cards: set.cards.map((card: any) => ({
                  id: card.id,
                  question: card.question,
                  answer: card.answer
                })),
                createdAt: set.createdAt,
                updatedAt: set.updatedAt
              }));

              // Save cleaned sets back
              localStorage.setItem(oldSetsKey, JSON.stringify(cleanedSets));
            }
          }
        }
      }

      // Mark migration as completed
      localStorage.setItem(MIGRATION_KEY, 'true');
    } catch (error) {
      console.error('Error during data migration:', error);
      // Don't block app initialization if migration fails
    }
  }

  /**
   * Get progress for a specific card
   */
  getCardProgress(cardId: string): UserCardProgress | null {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return null;
    }

    const progress = this.getProgressForCurrentUser();
    return progress[cardId] || null;
  }

  /**
   * Update progress for a specific card
   */
  updateCardProgress(cardId: string, updates: Partial<UserCardProgress>): void {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return;
    }

    const progress = this.getProgressForCurrentUser();
    const existing = progress[cardId];

    if (existing) {
      progress[cardId] = {
        ...existing,
        ...updates,
        stats: {
          ...existing.stats,
          ...(updates.stats || {})
        }
      };
    } else {
      // Create new progress entry with defaults
      progress[cardId] = {
        weight: 1,
        consecutiveCorrect: 0,
        ...updates,
        stats: {
          totalAttempts: 0,
          correctAttempts: 0,
          fastAttempts: 0,
          slowAttempts: 0,
          incorrectAttempts: 0,
          ...(updates.stats || {})
        }
      };
    }

    this.saveProgressForUser(currentUser, progress);
    // Trigger signal update to notify computed signals that progress has changed
    this.progressUpdateTrigger.update(value => value + 1);
  }

  /**
   * Get all progress for current user
   */
  getProgressForCurrentUser(): UserProgress {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return {};
    }

    return this.loadProgressForUser(currentUser);
  }

  /**
   * Load progress for a specific user
   */
  private loadProgressForUser(userName: string): UserProgress {
    // Check cache first
    if (this.progressCache.has(userName)) {
      return this.progressCache.get(userName)!;
    }

    try {
      const storageKey = this.getStorageKey(userName);
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        const emptyProgress: UserProgress = {};
        this.progressCache.set(userName, emptyProgress);
        return emptyProgress;
      }

      const progress = JSON.parse(stored) as UserProgress;
      this.progressCache.set(userName, progress);
      return progress;
    } catch (error) {
      console.error(`Error loading progress for user ${userName}:`, error);
      const emptyProgress: UserProgress = {};
      this.progressCache.set(userName, emptyProgress);
      return emptyProgress;
    }
  }

  /**
   * Save progress for a specific user
   */
  private saveProgressForUser(userName: string, progress: UserProgress): void {
    try {
      const storageKey = this.getStorageKey(userName);
      localStorage.setItem(storageKey, JSON.stringify(progress));
      this.progressCache.set(userName, progress);
    } catch (error) {
      console.error(`Error saving progress for user ${userName}:`, error);
    }
  }

  /**
   * Get storage key for a user's progress
   */
  private getStorageKey(userName: string): string {
    return `${STORAGE_PREFIX}${userName}${STORAGE_SUFFIX_PROGRESS}`;
  }

  /**
   * Clear progress cache (useful when switching users)
   */
  clearCache(): void {
    this.progressCache.clear();
  }

  /**
   * Initialize empty progress for a new user
   */
  initializeUserProgress(userName: string): void {
    const emptyProgress: UserProgress = {};
    this.saveProgressForUser(userName, emptyProgress);
  }

  /**
   * Delete progress for a user (when user is deleted)
   */
  deleteUserProgress(userName: string): void {
    try {
      const storageKey = this.getStorageKey(userName);
      localStorage.removeItem(storageKey);
      this.progressCache.delete(userName);
    } catch (error) {
      console.error(`Error deleting progress for user ${userName}:`, error);
    }
  }

  /**
   * Reset progress for all cards in a set (for current user)
   * @param cardIds - Array of card IDs to reset
   */
  resetSetProgress(cardIds: string[]): void {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return;
    }

    const progress = this.getProgressForCurrentUser();
    
    // Remove progress entries for all cards in the set
    let hasChanges = false;
    for (const cardId of cardIds) {
      if (progress[cardId]) {
        delete progress[cardId];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveProgressForUser(currentUser, progress);
      // Trigger signal update to notify computed signals that progress has changed
      this.progressUpdateTrigger.update(value => value + 1);
    }
  }
}

