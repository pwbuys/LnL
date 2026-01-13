import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangeDetectionStrategy } from '@angular/core';
import { MathSettingsService } from '../../../services/math-settings.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  template: `
    <div class="settings">
      <header class="header">
        <button
          type="button"
          class="back-button"
          (click)="goBack()"
          aria-label="Go back"
        >
          ← Back
        </button>
        <h1>Settings</h1>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
        <div class="form-group">
          <label for="speedThreshold" class="label">
            Speed Threshold (milliseconds)
          </label>
          <p class="hint">
            Answers must be entered within this time to be considered "fast".
            Current: {{ currentThreshold() }}ms ({{ currentThresholdSeconds() }}s)
          </p>
          <input
            id="speedThreshold"
            type="number"
            formControlName="speedThreshold"
            class="input"
            [min]="minThreshold"
            [max]="maxThreshold"
            aria-required="true"
            aria-describedby="speedThresholdError speedThresholdHint"
          />
          <span id="speedThresholdHint" class="hint">
            Range: {{ minThreshold }}ms - {{ maxThreshold }}ms
          </span>
          @if (form.get('speedThreshold')?.invalid && form.get('speedThreshold')?.touched) {
            <span id="speedThresholdError" class="error">
              Speed threshold must be between {{ minThreshold }}ms and {{ maxThreshold }}ms
            </span>
          }
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="cancel-button"
            (click)="goBack()"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="submit-button"
            [disabled]="form.invalid"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .settings {
      min-height: 100vh;
      padding: 1rem;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #333);
      max-width: 600px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 2rem;
    }

    .back-button {
      background: transparent;
      border: none;
      color: var(--link-color, #4caf50);
      font-size: 1rem;
      cursor: pointer;
      padding: 0.5rem 0;
      margin-bottom: 1rem;
      min-height: 44px;
    }

    .back-button:hover {
      text-decoration: underline;
    }

    .header h1 {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      margin: 0;
      color: var(--text-primary, #333);
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .label {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    .hint {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      margin: 0;
    }

    .input {
      width: 100%;
      padding: 0.75rem;
      font-size: 1rem;
      border: 2px solid var(--input-border, #ccc);
      border-radius: 0.5rem;
      background: var(--input-bg, #fff);
      color: var(--text-primary, #333);
      min-height: 44px;
    }

    .input:focus {
      outline: none;
      border-color: var(--input-focus-border, #4caf50);
    }

    .error {
      font-size: 0.875rem;
      color: var(--error-color, #f44336);
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .cancel-button,
    .submit-button {
      flex: 1;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 0.5rem;
      cursor: pointer;
      min-height: 44px;
      border: 2px solid;
      transition: all 0.2s ease;
    }

    .cancel-button {
      background: transparent;
      color: var(--text-primary, #333);
      border-color: var(--button-secondary-border, #ccc);
    }

    .cancel-button:hover {
      background: var(--button-secondary-bg, #f0f0f0);
    }

    .submit-button {
      background: var(--button-primary-bg, #4caf50);
      color: var(--button-primary-text, #fff);
      border-color: var(--button-primary-border, #45a049);
    }

    .submit-button:hover:not(:disabled) {
      background: var(--button-primary-hover, #45a049);
    }

    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (prefers-color-scheme: dark) {
      .settings {
        --bg-primary: #1a1a1a;
        --text-primary: #fff;
        --text-secondary: #aaa;
        --input-bg: #2a2a2a;
        --input-border: #444;
        --input-focus-border: #4caf50;
        --button-secondary-bg: #333;
        --button-secondary-border: #555;
        --link-color: #4caf50;
        --error-color: #f44336;
        --button-primary-bg: #4caf50;
        --button-primary-hover: #45a049;
        --button-primary-border: #45a049;
        --button-primary-text: #fff;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(MathSettingsService);
  private readonly router = inject(Router);

  readonly form: FormGroup;
  readonly minThreshold = this.settingsService.getMinSpeedThreshold();
  readonly maxThreshold = this.settingsService.getMaxSpeedThreshold();
  readonly currentThreshold = this.settingsService.speedThresholdMs;
  readonly currentThresholdSeconds = () => Math.round(this.currentThreshold() / 1000);

  constructor() {
    const currentSettings = this.settingsService.getSettings();
    this.form = this.fb.group({
      speedThreshold: [
        currentSettings.speedThresholdMs,
        [
          Validators.required,
          Validators.min(this.minThreshold),
          Validators.max(this.maxThreshold)
        ]
      ]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const speedThreshold = this.form.get('speedThreshold')?.value;
    this.settingsService.saveSettings({ speedThresholdMs: speedThreshold });
    this.router.navigate(['/math']);
  }

  goBack(): void {
    this.router.navigate(['/math']);
  }
}

