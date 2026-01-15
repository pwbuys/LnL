import { Injectable, inject, effect, signal } from '@angular/core';
import { UserService } from './user.service';
import { MathCard, LevelId, LEVELS } from '../models/math-card.model';

const STORAGE_PREFIX = 'school-helper-user-';
const STORAGE_SUFFIX_PROGRESS = '-progress';
const STORAGE_SUFFIX_MASTERY = '-mastery';

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
  /** 
   * Tracks which levels this card has been mastered at.
   * A card is mastered at a level when answered correctly AND fast at that level's threshold.
   */
  masteredAtLevels?: LevelId[];
}

export type UserProgress = Record<string, UserCardProgress>;

/**
 * Tracks which levels have been mastered for each set
 * Key: setId, Value: highest level mastered (null if none)
 */
export type SetMastery = Record<string, LevelId | null>;

@Injectable({
  providedIn: 'root'
})
export class UserProgressService {
  private readonly userService = inject(UserService);
  private readonly progressCache = new Map<string, UserProgress>();
  private readonly masteryCache = new Map<string, SetMastery>();
  // Signal that updates whenever progress changes, used to trigger computed recalculations
  readonly progressUpdateTrigger = signal<number>(0);
  // Signal that updates whenever mastery changes
  readonly masteryUpdateTrigger = signal<number>(0);

  constructor() {
    // Migrate existing data on first load
    this.migrateExistingData();

    // Clear cache when user changes
    effect(() => {
      const currentUser = this.userService.currentUser();
      if (currentUser) {
        // Preload progress and mastery for current user
        this.loadProgressForUser(currentUser);
        this.loadMasteryForUser(currentUser);
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
        },
        // Preserve existing masteredAtLevels unless explicitly updated
        masteredAtLevels: updates.masteredAtLevels ?? existing.masteredAtLevels
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
        },
        masteredAtLevels: updates.masteredAtLevels ?? []
      };
    }

    this.saveProgressForUser(currentUser, progress);
    // Trigger signal update to notify computed signals that progress has changed
    this.progressUpdateTrigger.update(value => value + 1);
  }

  /**
   * Record that a card has been mastered at a specific level
   */
  recordCardLevelMastery(cardId: string, levelId: LevelId): void {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return;
    }

    const progress = this.getProgressForCurrentUser();
    const existing = progress[cardId];

    if (!existing) {
      return;
    }

    const currentMastered = existing.masteredAtLevels ?? [];
    if (!currentMastered.includes(levelId)) {
      progress[cardId] = {
        ...existing,
        masteredAtLevels: [...currentMastered, levelId]
      };
      this.saveProgressForUser(currentUser, progress);
      this.progressUpdateTrigger.update(v => v + 1);
    }
  }

  /**
   * Check if a card is mastered at a specific level
   */
  isCardMasteredAtLevel(cardId: string, levelId: LevelId): boolean {
    const progress = this.getCardProgress(cardId);
    if (!progress) {
      return false;
    }
    return progress.masteredAtLevels?.includes(levelId) ?? false;
  }

  /**
   * Get count of cards mastered at a specific level for given card IDs
   */
  getCardsMasteredAtLevelCount(cardIds: string[], levelId: LevelId): number {
    return cardIds.filter(cardId => this.isCardMasteredAtLevel(cardId, levelId)).length;
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

  /**
   * Reset progress and mastery for a set
   * @param setId - Set ID to reset
   * @param cardIds - Array of card IDs in the set
   */
  resetSetProgressAndMastery(setId: string, cardIds: string[]): void {
    this.resetSetProgress(cardIds);
    this.resetSetMastery(setId);
  }

  // ============ SET MASTERY METHODS ============

  /**
   * Get the mastery storage key for a user
   */
  private getMasteryStorageKey(userName: string): string {
    return `${STORAGE_PREFIX}${userName}${STORAGE_SUFFIX_MASTERY}`;
  }

  /**
   * Load mastery data for a user
   */
  private loadMasteryForUser(userName: string): SetMastery {
    if (this.masteryCache.has(userName)) {
      return this.masteryCache.get(userName)!;
    }

    try {
      const storageKey = this.getMasteryStorageKey(userName);
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        const emptyMastery: SetMastery = {};
        this.masteryCache.set(userName, emptyMastery);
        return emptyMastery;
      }

      const mastery = JSON.parse(stored) as SetMastery;
      this.masteryCache.set(userName, mastery);
      return mastery;
    } catch (error) {
      console.error(`Error loading mastery for user ${userName}:`, error);
      const emptyMastery: SetMastery = {};
      this.masteryCache.set(userName, emptyMastery);
      return emptyMastery;
    }
  }

  /**
   * Save mastery data for a user
   */
  private saveMasteryForUser(userName: string, mastery: SetMastery): void {
    try {
      const storageKey = this.getMasteryStorageKey(userName);
      localStorage.setItem(storageKey, JSON.stringify(mastery));
      this.masteryCache.set(userName, mastery);
    } catch (error) {
      console.error(`Error saving mastery for user ${userName}:`, error);
    }
  }

  /**
   * Get the highest mastered level for a set
   */
  getSetMastery(setId: string): LevelId | null {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return null;
    }

    // Read trigger to make this reactive
    this.masteryUpdateTrigger();

    const mastery = this.loadMasteryForUser(currentUser);
    return mastery[setId] ?? null;
  }

  /**
   * Get the mastery level as a number (0-4)
   * 0 = no mastery, 1 = level1, 2 = level2, 3 = level3, 4 = ninja
   */
  getMasteryStars(setId: string): number {
    const levelId = this.getSetMastery(setId);
    if (!levelId) {
      return 0;
    }
    const levelIndex = LEVELS.findIndex(l => l.id === levelId);
    return levelIndex >= 0 ? levelIndex + 1 : 0;
  }

  /**
   * Check if a level is unlocked for a set
   * Level 1 is always unlocked, others require previous level mastery
   */
  isLevelUnlocked(setId: string, levelId: LevelId): boolean {
    const levelIndex = LEVELS.findIndex(l => l.id === levelId);
    
    // Level 1 is always unlocked
    if (levelIndex === 0) {
      return true;
    }

    // Check if previous level is mastered
    const currentMastery = this.getSetMastery(setId);
    if (!currentMastery) {
      return false;
    }

    const masteryIndex = LEVELS.findIndex(l => l.id === currentMastery);
    return masteryIndex >= levelIndex - 1;
  }

  /**
   * Record mastery of a set at a specific level (only in Master mode)
   * Only updates if this level is higher than current mastery
   */
  recordSetMastery(setId: string, levelId: LevelId): void {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return;
    }

    const mastery = this.loadMasteryForUser(currentUser);
    const currentMastery = mastery[setId];

    // Only update if this is a higher level
    const newLevelIndex = LEVELS.findIndex(l => l.id === levelId);
    const currentLevelIndex = currentMastery 
      ? LEVELS.findIndex(l => l.id === currentMastery)
      : -1;

    if (newLevelIndex > currentLevelIndex) {
      mastery[setId] = levelId;
      this.saveMasteryForUser(currentUser, mastery);
      this.masteryUpdateTrigger.update(v => v + 1);
    }
  }

  /**
   * Reset mastery for a set (when progress is reset)
   */
  resetSetMastery(setId: string): void {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return;
    }

    const mastery = this.loadMasteryForUser(currentUser);
    if (mastery[setId]) {
      delete mastery[setId];
      this.saveMasteryForUser(currentUser, mastery);
      this.masteryUpdateTrigger.update(v => v + 1);
    }
  }

  /**
   * Delete mastery data for a user
   */
  deleteUserMastery(userName: string): void {
    try {
      const storageKey = this.getMasteryStorageKey(userName);
      localStorage.removeItem(storageKey);
      this.masteryCache.delete(userName);
    } catch (error) {
      console.error(`Error deleting mastery for user ${userName}:`, error);
    }
  }
}

