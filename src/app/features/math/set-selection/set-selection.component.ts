import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { MathStateService } from '../../../services/math-state.service';
import { UserProgressService } from '../../../services/user-progress.service';
import { ProgressIndicatorComponent } from '../shared/progress-indicator/progress-indicator.component';
import { UserSelectorComponent } from '../user-selector/user-selector.component';
import { MathSet, MathCard, ExerciseMode, TimedDuration, LevelId, LEVELS } from '../../../models/math-card.model';

@Component({
  selector: 'app-set-selection',
  imports: [RouterLink, ProgressIndicatorComponent, UserSelectorComponent],
  template: `
    <div class="set-selection">
      <header class="header">
        <div class="header-top">
          <h1>Math Practice</h1>
          <app-user-selector />
        </div>
        <p class="subtitle">Select a set to practice</p>
      </header>

      <nav class="nav">
        <a routerLink="/math/create" class="nav-link">Create New Set</a>
      </nav>

      <div class="sets-container">
        @if (availableSets().length === 0) {
          <p class="empty-state">No math sets available. Create one to get started!</p>
        } @else {
          @for (set of availableSets(); track set.id) {
            <div class="set-card-wrapper" [class.expanded]="expandedSetId() === set.id">
              <button
                type="button"
                class="set-card"
                (click)="toggleSetExpansion(set.id)"
                [attr.aria-label]="'Select ' + set.name"
                [attr.aria-expanded]="expandedSetId() === set.id"
              >
                <div class="set-card-header">
                  <h2 class="set-name">{{ set.name }}</h2>
                  <span class="set-count">{{ set.cards.length }} cards</span>
                </div>
                <app-progress-indicator [cards]="getCardsWithProgress(set)" [setId]="set.id" />
              </button>

              @if (expandedSetId() === set.id) {
                <div class="expansion-panel" role="region" aria-label="Exercise options">
                  <div class="option-section">
                    <h3 class="option-label">Select Mode</h3>
                    <div class="option-buttons">
                      <button
                        type="button"
                        class="option-button"
                        [class.selected]="selectedMode() === 'master'"
                        (click)="selectMode('master')"
                        aria-label="Master mode"
                      >
                        Master
                      </button>
                      <button
                        type="button"
                        class="option-button"
                        [class.selected]="selectedMode() === 'timed' && selectedTimedDuration() === 30"
                        (click)="selectTimedMode(30)"
                        aria-label="Timed mode 30 seconds"
                      >
                        30s
                      </button>
                      <button
                        type="button"
                        class="option-button"
                        [class.selected]="selectedMode() === 'timed' && selectedTimedDuration() === 60"
                        (click)="selectTimedMode(60)"
                        aria-label="Timed mode 60 seconds"
                      >
                        60s
                      </button>
                      <button
                        type="button"
                        class="option-button"
                        [class.selected]="selectedMode() === 'timed' && selectedTimedDuration() === 90"
                        (click)="selectTimedMode(90)"
                        aria-label="Timed mode 90 seconds"
                      >
                        90s
                      </button>
                    </div>
                  </div>

                  <div class="option-section">
                    <h3 class="option-label">Select Level</h3>
                    <div class="option-buttons levels">
                      @for (level of levels; track level.id) {
                        <button
                          type="button"
                          class="option-button level-button"
                          [class.selected]="selectedLevel() === level.id"
                          [class.ninja]="level.id === 'ninja'"
                          [class.locked]="!isLevelUnlocked(set.id, level.id)"
                          [disabled]="!isLevelUnlocked(set.id, level.id)"
                          (click)="selectLevel(level.id)"
                          [attr.aria-label]="getLevelAriaLabel(set.id, level)"
                        >
                          @if (!isLevelUnlocked(set.id, level.id)) {
                            <span class="lock-icon" aria-hidden="true">🔒</span>
                          }
                          <span class="level-name">{{ level.name }}</span>
                          <span class="level-time">{{ level.speedThresholdMs / 1000 }}s</span>
                        </button>
                      }
                    </div>
                  </div>

                  <button
                    type="button"
                    class="start-button"
                    (click)="startExercise(set.id)"
                    [disabled]="!canStart()"
                    aria-label="Start exercise"
                  >
                    Start
                  </button>
                </div>
              }

              <div class="set-actions">
                <button
                  type="button"
                  class="reset-button"
                  (click)="resetProgress(set.id, $event)"
                  [attr.aria-label]="'Reset progress for ' + set.name"
                  title="Reset progress"
                >
                  ↻
                </button>
                <button
                  type="button"
                  class="edit-button"
                  (click)="editSet(set.id, $event)"
                  [attr.aria-label]="'Edit ' + set.name"
                  title="Edit set"
                >
                  ✎
                </button>
                <button
                  type="button"
                  class="delete-button"
                  (click)="deleteSet(set.id, $event)"
                  [attr.aria-label]="'Delete ' + set.name"
                  title="Delete set"
                >
                  ✕
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .set-selection {
      min-height: 100vh; /* Fallback for older browsers */
      min-height: 100dvh; /* Dynamic viewport height - accounts for mobile browser UI */
      padding: 1rem;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #333);
    }

    .header {
      margin-bottom: 2rem;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      gap: 1rem;
    }

    .header h1 {
      font-size: clamp(2rem, 5vw, 3rem);
      margin: 0;
      color: var(--text-primary, #333);
    }

    .subtitle {
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      color: var(--text-secondary, #666);
      margin: 0;
    }

    .nav {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .nav-link {
      padding: 0.75rem 1.5rem;
      background: var(--button-bg, #4caf50);
      color: var(--button-text, #fff);
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: background 0.2s ease;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
    }

    .nav-link:hover {
      background: var(--button-hover, #45a049);
    }

    .sets-container {
      display: grid;
      gap: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .set-card-wrapper {
      position: relative;
    }

    .set-card {
      width: 100%;
      padding: 1.5rem;
      background: var(--card-bg, #f9f9f9);
      border: 2px solid var(--card-border, #e0e0e0);
      border-radius: 0.75rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 44px;
    }

    .set-card:hover {
      border-color: var(--card-hover-border, #4caf50);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .set-card:active {
      transform: translateY(0);
    }

    .set-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .set-name {
      font-size: clamp(1.25rem, 3vw, 1.5rem);
      margin: 0;
      color: var(--text-primary, #333);
    }

    .set-count {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      background: var(--badge-bg, #e0e0e0);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
    }

    .set-card-progress {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .progress-label {
      color: var(--text-secondary, #666);
    }

    .progress-value {
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    .set-actions {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      display: flex;
      gap: 0.5rem;
      z-index: 10;
    }

    .reset-button,
    .edit-button,
    .delete-button {
      width: 32px;
      height: 32px;
      border: none;
      color: #fff;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: all 0.2s ease;
    }

    .reset-button {
      background: var(--reset-bg, #ff9800);
    }

    .reset-button:hover {
      background: var(--reset-hover, #f57c00);
      transform: scale(1.1);
    }

    .reset-button:active {
      transform: scale(0.95);
    }

    .edit-button {
      background: var(--edit-bg, #2196f3);
    }

    .edit-button:hover {
      background: var(--edit-hover, #1976d2);
      transform: scale(1.1);
    }

    .edit-button:active {
      transform: scale(0.95);
    }

    .delete-button {
      background: var(--delete-bg, #f44336);
    }

    .delete-button:hover {
      background: var(--delete-hover, #d32f2f);
      transform: scale(1.1);
    }

    .delete-button:active {
      transform: scale(0.95);
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary, #666);
      font-size: 1.125rem;
    }

    /* Expansion panel styles */
    .set-card-wrapper.expanded .set-card {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom: none;
    }

    .expansion-panel {
      background: var(--card-bg, #f9f9f9);
      border: 2px solid var(--card-border, #e0e0e0);
      border-top: none;
      border-radius: 0 0 0.75rem 0.75rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .option-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .option-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary, #666);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .option-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .option-buttons.levels {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    .option-button {
      flex: 1;
      min-width: 60px;
      padding: 0.75rem 1rem;
      border: 2px solid var(--option-border, #ccc);
      background: var(--option-bg, #fff);
      color: var(--text-primary, #333);
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 44px;
    }

    .option-button:hover {
      border-color: var(--option-hover-border, #4caf50);
      background: var(--option-hover-bg, #e8f5e9);
    }

    .option-button.selected {
      border-color: var(--option-selected-border, #4caf50);
      background: var(--option-selected-bg, #4caf50);
      color: var(--option-selected-text, #fff);
    }

    .level-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem;
    }

    .level-name {
      font-weight: 700;
    }

    .level-time {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .level-button.ninja {
      background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
      border-color: #1a1a1a;
      color: #fff;
    }

    .level-button.ninja:hover {
      background: linear-gradient(135deg, #333 0%, #444 100%);
      border-color: #444;
    }

    .level-button.ninja.selected {
      background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
      border-color: #4caf50;
      box-shadow: 0 0 0 2px #4caf50;
    }

    .level-button.locked {
      opacity: 0.5;
      cursor: not-allowed;
      position: relative;
    }

    .level-button.locked:hover {
      border-color: var(--option-border, #ccc);
      background: var(--option-bg, #fff);
    }

    .level-button.ninja.locked {
      background: linear-gradient(135deg, #2a2a2a 0%, #444 100%);
    }

    .level-button.ninja.locked:hover {
      background: linear-gradient(135deg, #2a2a2a 0%, #444 100%);
    }

    .lock-icon {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      font-size: 0.75rem;
    }

    .start-button {
      width: 100%;
      padding: 1rem;
      background: var(--start-bg, #4caf50);
      color: var(--start-text, #fff);
      border: none;
      border-radius: 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      min-height: 56px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .start-button:hover:not(:disabled) {
      background: var(--start-hover, #45a049);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .start-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (prefers-color-scheme: dark) {
      .set-selection {
        --bg-primary: #1a1a1a;
        --text-primary: #fff;
        --text-secondary: #aaa;
        --card-bg: #2a2a2a;
        --card-border: #444;
        --card-hover-border: #4caf50;
        --button-bg: #4caf50;
        --button-hover: #45a049;
        --button-text: #fff;
        --badge-bg: #444;
        --edit-bg: #2196f3;
        --edit-hover: #1976d2;
        --delete-bg: #f44336;
        --delete-hover: #d32f2f;
        --reset-bg: #ff9800;
        --reset-hover: #f57c00;
        --option-bg: #333;
        --option-border: #555;
        --option-hover-bg: #3a3a3a;
        --option-hover-border: #4caf50;
        --option-selected-bg: #4caf50;
        --option-selected-border: #4caf50;
        --option-selected-text: #fff;
        --start-bg: #4caf50;
        --start-hover: #45a049;
        --start-text: #fff;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetSelectionComponent {
  private readonly mathStateService = inject(MathStateService);
  private readonly userProgressService = inject(UserProgressService);
  private readonly router = inject(Router);

  readonly availableSets = this.mathStateService.availableSets;
  readonly levels = LEVELS;

  // Expansion state
  readonly expandedSetId = signal<string | null>(null);
  readonly selectedMode = signal<ExerciseMode | null>(null);
  readonly selectedTimedDuration = signal<TimedDuration | null>(null);
  readonly selectedLevel = signal<LevelId | null>(null);

  getCardsWithProgress(set: MathSet): MathCard[] {
    return this.mathStateService.getCardsWithProgress(set);
  }

  toggleSetExpansion(setId: string): void {
    if (this.expandedSetId() === setId) {
      // Collapse
      this.expandedSetId.set(null);
      this.resetSelections();
    } else {
      // Expand and select defaults
      this.expandedSetId.set(setId);
      this.selectedMode.set('master');
      this.selectedTimedDuration.set(null);
      // Select the first unlocked level (level1 is always unlocked)
      this.selectedLevel.set('level1');
    }
  }

  selectMode(mode: ExerciseMode): void {
    this.selectedMode.set(mode);
    if (mode === 'master') {
      this.selectedTimedDuration.set(null);
    }
  }

  selectTimedMode(duration: TimedDuration): void {
    this.selectedMode.set('timed');
    this.selectedTimedDuration.set(duration);
  }

  selectLevel(levelId: LevelId): void {
    // Only allow selecting unlocked levels (validation is also done in UI)
    const setId = this.expandedSetId();
    if (setId && this.isLevelUnlocked(setId, levelId)) {
      this.selectedLevel.set(levelId);
    }
  }

  isLevelUnlocked(setId: string, levelId: LevelId): boolean {
    return this.userProgressService.isLevelUnlocked(setId, levelId);
  }

  getLevelAriaLabel(setId: string, level: { id: LevelId; name: string; speedThresholdMs: number }): string {
    const isUnlocked = this.isLevelUnlocked(setId, level.id);
    const baseLabel = `${level.name} - ${level.speedThresholdMs / 1000} seconds`;
    return isUnlocked ? baseLabel : `${baseLabel} (locked - complete previous level first)`;
  }

  /**
   * Get the first unlocked level for a set (to use as default selection)
   */
  private getFirstUnlockedLevel(setId: string): LevelId {
    // Find the first unlocked level
    for (const level of LEVELS) {
      if (this.isLevelUnlocked(setId, level.id)) {
        // Return this level, but only if there's no higher unlocked level
        // We want to default to the highest unlocked level that's not yet mastered
        continue;
      } else {
        // Found a locked level, return the previous one
        const prevIndex = LEVELS.findIndex(l => l.id === level.id) - 1;
        if (prevIndex >= 0) {
          return LEVELS[prevIndex].id;
        }
        break;
      }
    }
    // All levels unlocked or level1
    return 'level1';
  }

  canStart(): boolean {
    const mode = this.selectedMode();
    const level = this.selectedLevel();
    
    if (!mode || !level) {
      return false;
    }

    if (mode === 'timed' && !this.selectedTimedDuration()) {
      return false;
    }

    return true;
  }

  startExercise(setId: string): void {
    if (!this.canStart()) {
      return;
    }

    const mode = this.selectedMode()!;
    const level = this.selectedLevel()!;
    const timedDuration = this.selectedTimedDuration() ?? undefined;

    this.mathStateService.setCurrentSet(setId);
    this.mathStateService.setExerciseOptions(mode, level, timedDuration);
    this.router.navigate(['/math/exercise', setId]);
  }

  private resetSelections(): void {
    this.selectedMode.set(null);
    this.selectedTimedDuration.set(null);
    this.selectedLevel.set(null);
  }

  editSet(setId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/math/edit', setId]);
  }

  deleteSet(setId: string, event: Event): void {
    event.stopPropagation();
    const set = this.availableSets().find(s => s.id === setId);
    if (set && confirm(`Are you sure you want to delete "${set.name}"? This action cannot be undone.`)) {
      this.mathStateService.deleteSet(setId);
    }
  }

  resetProgress(setId: string, event: Event): void {
    event.stopPropagation();
    const set = this.availableSets().find(s => s.id === setId);
    if (set && confirm(`Are you sure you want to reset all progress for "${set.name}"? This will clear all statistics and weights for this set.`)) {
      this.mathStateService.resetSetProgress(setId);
    }
  }
}

