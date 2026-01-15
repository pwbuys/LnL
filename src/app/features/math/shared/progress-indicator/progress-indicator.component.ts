import { Component, computed, input, inject } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { MathCard, LevelId } from '../../../../models/math-card.model';
import { UserProgressService } from '../../../../services/user-progress.service';

@Component({
  selector: 'app-progress-indicator',
  imports: [],
  template: `
    @if (showProgressBar()) {
      <!-- Progress bar mode (for exercise view) -->
      <div 
        class="progress-indicator" 
        role="progressbar" 
        [attr.aria-valuenow]="masteredCount()" 
        [attr.aria-valuemin]="0" 
        [attr.aria-valuemax]="totalCards()" 
        [attr.aria-label]="'Mastery progress: ' + masteredCount() + ' of ' + totalCards() + ' cards mastered'"
      >
        <div class="progress-label">
          <span class="progress-text">Mastery: {{ masteredCount() }} / {{ totalCards() }}</span>
          <span class="progress-percentage">{{ percentage() }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" [style.width.%]="percentage()"></div>
        </div>
      </div>
    } @else {
      <!-- Stars mode (for set selection) -->
      <div 
        class="progress-indicator" 
        role="img" 
        [attr.aria-label]="ariaLabel()"
      >
        @if (masteryStars() === 4) {
          <!-- Ninja mastery -->
          <div class="mastery-display ninja">
            <span class="ninja-icon" aria-hidden="true">🥷</span>
            <span class="mastery-label">Ninja Master</span>
          </div>
        } @else {
          <!-- Star display -->
          <div class="mastery-display">
            <div class="stars-container">
              @for (star of [1, 2, 3, 4]; track star) {
                <span 
                  class="star" 
                  [class.filled]="star <= masteryStars()"
                  [class.empty]="star > masteryStars()"
                  aria-hidden="true"
                >
                  {{ star <= masteryStars() ? '★' : '☆' }}
                </span>
              }
            </div>
            <span class="mastery-label">{{ masteryLabel() }}</span>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .progress-indicator {
      width: 100%;
    }

    /* Progress bar styles */
    .progress-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .progress-text {
      color: var(--text-secondary, #666);
    }

    .progress-percentage {
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    .progress-bar-container {
      width: 100%;
      height: 0.5rem;
      background: var(--progress-bg, #e0e0e0);
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: var(--progress-fill, #4caf50);
      border-radius: 0.25rem;
      transition: width 0.3s ease;
    }

    /* Stars display styles */
    .mastery-display {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mastery-display.ninja {
      justify-content: flex-start;
    }

    .stars-container {
      display: flex;
      gap: 0.25rem;
    }

    .star {
      font-size: 1.25rem;
      line-height: 1;
    }

    .star.filled {
      color: var(--star-filled, #ffc107);
    }

    .star.empty {
      color: var(--star-empty, #ccc);
    }

    .ninja-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .mastery-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }

    .mastery-display.ninja .mastery-label {
      font-weight: 600;
      color: var(--ninja-text, #333);
    }

    @media (prefers-color-scheme: dark) {
      .progress-indicator {
        --text-primary: #fff;
        --text-secondary: #aaa;
        --progress-bg: #444;
        --progress-fill: #4caf50;
        --star-filled: #ffc107;
        --star-empty: #555;
        --ninja-text: #fff;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressIndicatorComponent {
  private readonly userProgressService = inject(UserProgressService);

  readonly cards = input.required<MathCard[]>();
  readonly setId = input<string>('');
  /** When true, shows the progress bar instead of stars (for exercise view) */
  readonly showProgressBar = input<boolean>(false);
  /** The current level ID (used for level-specific mastery in progress bar mode) */
  readonly currentLevelId = input<LevelId | null>(null);

  // Progress bar computed properties
  readonly totalCards = computed(() => this.cards().length);
  
  /**
   * Count of cards mastered at the current level.
   * Uses level-specific mastery tracking when currentLevelId is provided.
   */
  readonly masteredCount = computed(() => {
    const levelId = this.currentLevelId();
    const cards = this.cards();
    
    if (levelId) {
      // Level-specific mastery: count cards mastered at this level
      return cards.filter(card => 
        this.userProgressService.isCardMasteredAtLevel(card.id, levelId)
      ).length;
    }
    
    // Fallback to weight-based mastery (for backwards compatibility)
    return cards.filter(card => 
      card.weight === 1 && card.stats.totalAttempts > 0
    ).length;
  });
  
  readonly percentage = computed(() => {
    const total = this.totalCards();
    if (total === 0) {
      return 0;
    }
    return Math.round((this.masteredCount() / total) * 100);
  });

  // Stars display computed properties
  readonly masteryStars = computed(() => {
    const id = this.setId();
    if (!id) {
      return 0;
    }
    return this.userProgressService.getMasteryStars(id);
  });

  readonly masteryLabel = computed(() => {
    const stars = this.masteryStars();
    if (stars === 0) {
      return 'Not mastered';
    }
    if (stars === 4) {
      return 'Ninja Master';
    }
    return `Level ${stars} mastered`;
  });

  readonly ariaLabel = computed(() => {
    const stars = this.masteryStars();
    if (stars === 0) {
      return 'No levels mastered yet';
    }
    if (stars === 4) {
      return 'Ninja level mastered';
    }
    return `${stars} of 4 levels mastered`;
  });
}

