import { Injectable, signal, inject, effect } from '@angular/core';
import { UserService } from './user.service';

const STORAGE_PREFIX = 'school-helper-user-';
const STORAGE_SUFFIX_SETTINGS = '-settings';
const DEFAULT_SPEED_THRESHOLD_MS = 3000;
const MIN_SPEED_THRESHOLD_MS = 1000;
const MAX_SPEED_THRESHOLD_MS = 10000;

export interface MathSettings {
  speedThresholdMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class MathSettingsService {
  private readonly userService = inject(UserService);
  readonly speedThresholdMs = signal<number>(DEFAULT_SPEED_THRESHOLD_MS);

  constructor() {
    // Load settings when user changes
    effect(() => {
      const currentUser = this.userService.currentUser();
      if (currentUser) {
        this.loadFromLocalStorage(currentUser);
      }
    });
  }

  /**
   * Load settings from localStorage for a specific user
   */
  private loadFromLocalStorage(userName: string): void {
    try {
      const storageKey = this.getStorageKey(userName);
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const settings = JSON.parse(stored) as MathSettings;
        // Validate and set speed threshold
        const threshold = this.validateSpeedThreshold(settings.speedThresholdMs);
        this.speedThresholdMs.set(threshold);
      } else {
        // No settings for this user, use default
        this.speedThresholdMs.set(DEFAULT_SPEED_THRESHOLD_MS);
      }
    } catch (error) {
      console.error(`Error loading math settings for user ${userName}:`, error);
      // Use default value
      this.speedThresholdMs.set(DEFAULT_SPEED_THRESHOLD_MS);
    }
  }

  /**
   * Save settings to localStorage for current user
   */
  saveSettings(settings: MathSettings): void {
    const currentUser = this.userService.getCurrentUserName();
    if (!currentUser) {
      return;
    }

    try {
      const validatedSettings: MathSettings = {
        speedThresholdMs: this.validateSpeedThreshold(settings.speedThresholdMs)
      };
      const storageKey = this.getStorageKey(currentUser);
      localStorage.setItem(storageKey, JSON.stringify(validatedSettings));
      this.speedThresholdMs.set(validatedSettings.speedThresholdMs);
    } catch (error) {
      console.error('Error saving math settings to localStorage:', error);
    }
  }

  /**
   * Get storage key for a user's settings
   */
  private getStorageKey(userName: string): string {
    return `${STORAGE_PREFIX}${userName}${STORAGE_SUFFIX_SETTINGS}`;
  }

  /**
   * Initialize default settings for a new user
   */
  initializeUserSettings(userName: string): void {
    const defaultSettings: MathSettings = {
      speedThresholdMs: DEFAULT_SPEED_THRESHOLD_MS
    };
    const storageKey = this.getStorageKey(userName);
    localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
  }

  /**
   * Delete settings for a user (when user is deleted)
   */
  deleteUserSettings(userName: string): void {
    try {
      const storageKey = this.getStorageKey(userName);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error deleting settings for user ${userName}:`, error);
    }
  }

  /**
   * Validate speed threshold is within allowed range
   */
  private validateSpeedThreshold(threshold: number): number {
    if (typeof threshold !== 'number' || isNaN(threshold)) {
      return DEFAULT_SPEED_THRESHOLD_MS;
    }
    return Math.max(
      MIN_SPEED_THRESHOLD_MS,
      Math.min(MAX_SPEED_THRESHOLD_MS, threshold)
    );
  }

  /**
   * Get current settings
   */
  getSettings(): MathSettings {
    return {
      speedThresholdMs: this.speedThresholdMs()
    };
  }

  /**
   * Get minimum allowed speed threshold
   */
  getMinSpeedThreshold(): number {
    return MIN_SPEED_THRESHOLD_MS;
  }

  /**
   * Get maximum allowed speed threshold
   */
  getMaxSpeedThreshold(): number {
    return MAX_SPEED_THRESHOLD_MS;
  }
}

