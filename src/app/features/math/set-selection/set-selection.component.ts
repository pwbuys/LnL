import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { MathStateService } from '../../../services/math-state.service';
import { ProgressIndicatorComponent } from '../shared/progress-indicator/progress-indicator.component';
import { UserSelectorComponent } from '../user-selector/user-selector.component';
import { MathSet, MathCard } from '../../../models/math-card.model';

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
        <a routerLink="/math/settings" class="nav-link">Settings</a>
      </nav>

      <div class="sets-container">
        @if (availableSets().length === 0) {
          <p class="empty-state">No math sets available. Create one to get started!</p>
        } @else {
          @for (set of availableSets(); track set.id) {
            <div class="set-card-wrapper">
              <button
                type="button"
                class="set-card"
                (click)="selectSet(set.id)"
                [attr.aria-label]="'Select ' + set.name"
              >
                <div class="set-card-header">
                  <h2 class="set-name">{{ set.name }}</h2>
                  <span class="set-count">{{ set.cards.length }} cards</span>
                </div>
                <app-progress-indicator [cards]="getCardsWithProgress(set)" />
              </button>
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
      min-height: 100vh;
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
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetSelectionComponent {
  private readonly mathStateService = inject(MathStateService);
  private readonly router = inject(Router);

  readonly availableSets = this.mathStateService.availableSets;

  getCardsWithProgress(set: MathSet): MathCard[] {
    return this.mathStateService.getCardsWithProgress(set);
  }

  selectSet(setId: string): void {
    this.mathStateService.setCurrentSet(setId);
    this.router.navigate(['/math/exercise', setId]);
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

