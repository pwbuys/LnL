import { Component, computed, input } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';
import { MathCard } from '../../../../models/math-card.model';

@Component({
  selector: 'app-progress-indicator',
  imports: [],
  template: `
    <div class="progress-indicator" role="progressbar" [attr.aria-valuenow]="masteredCount()" [attr.aria-valuemin]="0" [attr.aria-valuemax]="totalCards()" [attr.aria-label]="'Mastery progress: ' + masteredCount() + ' of ' + totalCards() + ' cards mastered'">
      <div class="progress-label">
        <span class="progress-text">Mastery: {{ masteredCount() }} / {{ totalCards() }}</span>
        <span class="progress-percentage">{{ percentage() }}%</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" [style.width.%]="percentage()"></div>
      </div>
    </div>
  `,
  styles: `
    .progress-indicator {
      width: 100%;
    }

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

    @media (prefers-color-scheme: dark) {
      .progress-indicator {
        --text-primary: #fff;
        --text-secondary: #aaa;
        --progress-bg: #444;
        --progress-fill: #4caf50;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressIndicatorComponent {
  readonly cards = input.required<MathCard[]>();

  readonly totalCards = computed(() => this.cards().length);
  readonly masteredCount = computed(() => 
    this.cards().filter(card => 
      card.weight === 1 && card.stats.totalAttempts > 0
    ).length
  );
  readonly percentage = computed(() => {
    const total = this.totalCards();
    if (total === 0) {
      return 0;
    }
    return Math.round((this.masteredCount() / total) * 100);
  });
}

