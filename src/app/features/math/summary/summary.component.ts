import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { MathStateService } from '../../../services/math-state.service';
import { UserProgressService } from '../../../services/user-progress.service';
import { MathCard, getLevelById, LEVELS, LevelId } from '../../../models/math-card.model';

@Component({
  selector: 'app-summary',
  imports: [],
  template: `
    <div class="summary">
      <header class="header">
        <h1>Session Summary</h1>
        @if (sessionStats()) {
          <div class="session-info">
            <span class="mode-badge" [class.timed]="isTimedMode()">
              {{ isTimedMode() ? 'Timed' : 'Master' }}
            </span>
            <span class="level-badge" [class.ninja]="sessionStats()!.level === 'ninja'">
              {{ levelName() }}
            </span>
          </div>
        }
      </header>

      @if (sessionStats()) {
        @if (isTimedMode()) {
          <div class="timed-result">
            <div class="timed-score">{{ sessionStats()!.correctAnswers }}</div>
            <div class="timed-label">correct answers in {{ sessionStats()!.timedDuration }}s</div>
          </div>
        }

        <div class="stats-container">
          <div class="stat-card">
            <div class="stat-label">Total Questions</div>
            <div class="stat-value">{{ sessionStats()!.totalQuestions }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Correct Answers</div>
            <div class="stat-value stat-correct">{{ sessionStats()!.correctAnswers }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Fast Answers</div>
            <div class="stat-value stat-fast">{{ sessionStats()!.fastAnswers }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Slow Answers</div>
            <div class="stat-value stat-slow">{{ sessionStats()!.slowAnswers }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Incorrect Answers</div>
            <div class="stat-value stat-incorrect">{{ sessionStats()!.incorrectAnswers }}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Average Time</div>
            <div class="stat-value">{{ averageTimeFormatted() }}</div>
          </div>

          <div class="stat-card stat-card-full">
            <div class="stat-label">Accuracy</div>
            <div class="stat-value">{{ accuracyPercentage() }}%</div>
          </div>
        </div>

        @if (cardsNeedingWork().length > 0) {
          <div class="needs-work-section">
            <h2>Needs Work On:</h2>
            <ul class="needs-work-list">
              @for (card of cardsNeedingWork(); track card.id) {
                <li class="needs-work-item">
                  <span class="card-question">{{ card.question }}</span>
                  <span class="card-weight">Weight: {{ card.weight }}</span>
                </li>
              }
            </ul>
          </div>
        } @else {
          <div class="all-mastered">
            <p>Great job! All cards are mastered!</p>
          </div>
        }
      } @else {
        <div class="no-stats">
          <p>No session statistics available.</p>
        </div>
      }

      <div class="actions">
        @if (canStartNextLevel()) {
          <button
            type="button"
            class="action-button action-button-next-level"
            (click)="startNextLevel()"
          >
            Next Level →
          </button>
        }
        <button
          type="button"
          class="action-button action-button-primary"
          (click)="startNewSession()"
        >
          Start New Session
        </button>
        <button
          type="button"
          class="action-button action-button-secondary"
          (click)="goToSets()"
        >
          Back to Sets
        </button>
      </div>
    </div>
  `,
  styles: `
    .summary {
      min-height: 100vh; /* Fallback for older browsers */
      min-height: 100dvh; /* Dynamic viewport height - accounts for mobile browser UI */
      padding: 1rem;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #333);
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: clamp(2rem, 5vw, 3rem);
      margin: 0 0 0.75rem 0;
      color: var(--text-primary, #333);
    }

    .session-info {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .mode-badge,
    .level-badge {
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      background: var(--badge-bg, #e0e0e0);
      color: var(--text-primary, #333);
    }

    .mode-badge.timed {
      background: var(--timed-bg, #2196f3);
      color: #fff;
    }

    .level-badge.ninja {
      background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
      color: #fff;
    }

    .timed-result {
      text-align: center;
      padding: 2rem;
      background: var(--timed-result-bg, #e3f2fd);
      border: 2px solid var(--timed-result-border, #2196f3);
      border-radius: 0.75rem;
      margin-bottom: 2rem;
    }

    .timed-score {
      font-size: clamp(4rem, 15vw, 8rem);
      font-weight: 800;
      color: var(--timed-score-color, #2196f3);
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .timed-label {
      font-size: clamp(1rem, 3vw, 1.5rem);
      color: var(--text-secondary, #666);
      font-weight: 500;
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1.5rem;
      background: var(--card-bg, #f9f9f9);
      border: 2px solid var(--card-border, #e0e0e0);
      border-radius: 0.75rem;
      text-align: center;
    }

    .stat-card-full {
      grid-column: 1 / -1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      font-weight: 700;
      color: var(--text-primary, #333);
    }

    .stat-correct {
      color: var(--success-color, #4caf50);
    }

    .stat-fast {
      color: var(--fast-color, #2196f3);
    }

    .stat-slow {
      color: var(--slow-color, #ff9800);
    }

    .stat-incorrect {
      color: var(--error-color, #f44336);
    }

    .needs-work-section {
      margin-bottom: 2rem;
    }

    .needs-work-section h2 {
      font-size: clamp(1.25rem, 3vw, 1.75rem);
      margin: 0 0 1rem 0;
      color: var(--text-primary, #333);
    }

    .needs-work-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .needs-work-item {
      padding: 1rem;
      background: var(--card-bg, #f9f9f9);
      border: 2px solid var(--card-border, #e0e0e0);
      border-radius: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-question {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    .card-weight {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      background: var(--badge-bg, #e0e0e0);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
    }

    .all-mastered {
      text-align: center;
      padding: 2rem;
      background: var(--success-bg, #e8f5e9);
      border: 2px solid var(--success-border, #4caf50);
      border-radius: 0.75rem;
      margin-bottom: 2rem;
    }

    .all-mastered p {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--success-color, #2e7d32);
      margin: 0;
    }

    .no-stats {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary, #666);
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 2rem;
    }

    .action-button {
      width: 100%;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 0.5rem;
      cursor: pointer;
      min-height: 44px;
      border: 2px solid;
      transition: all 0.2s ease;
    }

    .action-button-primary {
      background: var(--button-primary-bg, #4caf50);
      color: var(--button-primary-text, #fff);
      border-color: var(--button-primary-border, #45a049);
    }

    .action-button-primary:hover {
      background: var(--button-primary-hover, #45a049);
    }

    .action-button-secondary {
      background: transparent;
      color: var(--text-primary, #333);
      border-color: var(--button-secondary-border, #ccc);
    }

    .action-button-secondary:hover {
      background: var(--button-secondary-bg, #f0f0f0);
    }

    .action-button-next-level {
      background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      color: #fff;
      border-color: #f57c00;
      font-size: 1.125rem;
    }

    .action-button-next-level:hover {
      background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
    }

    @media (prefers-color-scheme: dark) {
      .summary {
        --bg-primary: #1a1a1a;
        --text-primary: #fff;
        --text-secondary: #aaa;
        --card-bg: #2a2a2a;
        --card-border: #444;
        --badge-bg: #444;
        --success-bg: #1b5e20;
        --success-border: #4caf50;
        --success-color: #4caf50;
        --fast-color: #2196f3;
        --slow-color: #ff9800;
        --error-color: #f44336;
        --button-primary-bg: #4caf50;
        --button-primary-hover: #45a049;
        --button-primary-border: #45a049;
        --button-primary-text: #fff;
        --button-secondary-border: #555;
        --button-secondary-bg: #333;
        --timed-bg: #2196f3;
        --timed-result-bg: #1565c0;
        --timed-result-border: #2196f3;
        --timed-score-color: #64b5f6;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryComponent {
  private readonly mathStateService = inject(MathStateService);
  private readonly userProgressService = inject(UserProgressService);
  private readonly router = inject(Router);

  readonly sessionStats = this.mathStateService.currentSessionStats;
  readonly currentSet = this.mathStateService.currentSet;

  readonly isTimedMode = computed(() => {
    const stats = this.sessionStats();
    return stats?.mode === 'timed';
  });

  readonly levelName = computed(() => {
    const stats = this.sessionStats();
    if (!stats?.level) {
      return 'Level 1';
    }
    const level = getLevelById(stats.level);
    return level.name;
  });

  readonly accuracyPercentage = computed(() => {
    const stats = this.sessionStats();
    if (!stats || stats.totalQuestions === 0) {
      return 0;
    }
    return Math.round((stats.correctAnswers / stats.totalQuestions) * 100);
  });

  readonly averageTimeFormatted = computed(() => {
    const stats = this.sessionStats();
    if (!stats) {
      return '0s';
    }
    const seconds = Math.round(stats.averageTimeMs / 1000);
    return `${seconds}s`;
  });

  readonly cardsNeedingWork = computed(() => {
    const set = this.currentSet();
    if (!set) {
      return [];
    }
    const cardsWithProgress = this.mathStateService.getCardsWithProgress(set);
    return cardsWithProgress
      .filter(card => card.weight > 1)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10); // Show top 10 cards needing work
  });

  /**
   * Check if the user can start the next level
   * True if: Master mode, level was mastered, and there's a next level available
   */
  readonly canStartNextLevel = computed(() => {
    const stats = this.sessionStats();
    const set = this.currentSet();
    
    // Must be master mode
    if (!stats || stats.mode !== 'master' || !stats.level || !set) {
      return false;
    }

    // Check if there's a next level
    const currentLevelIndex = LEVELS.findIndex(l => l.id === stats.level);
    if (currentLevelIndex === -1 || currentLevelIndex >= LEVELS.length - 1) {
      return false; // Already at max level (ninja)
    }

    // Check if the current level was mastered
    const setMastery = this.userProgressService.getSetMastery(set.id);
    if (!setMastery) {
      return false;
    }

    // Current level must be mastered
    const masteryIndex = LEVELS.findIndex(l => l.id === setMastery);
    return masteryIndex >= currentLevelIndex;
  });

  /**
   * Get the next level ID
   */
  private getNextLevelId(): LevelId | null {
    const stats = this.sessionStats();
    if (!stats?.level) {
      return null;
    }

    const currentLevelIndex = LEVELS.findIndex(l => l.id === stats.level);
    if (currentLevelIndex === -1 || currentLevelIndex >= LEVELS.length - 1) {
      return null;
    }

    return LEVELS[currentLevelIndex + 1].id;
  }

  startNextLevel(): void {
    const set = this.currentSet();
    const nextLevelId = this.getNextLevelId();
    
    if (set && nextLevelId) {
      this.mathStateService.setExerciseOptions('master', nextLevelId);
      this.mathStateService.startSession();
      this.router.navigate(['/math/exercise', set.id]);
    }
  }

  startNewSession(): void {
    const set = this.currentSet();
    if (set) {
      this.mathStateService.startSession();
      this.router.navigate(['/math/exercise', set.id]);
    } else {
      this.router.navigate(['/math']);
    }
  }

  goToSets(): void {
    this.router.navigate(['/math']);
  }
}

