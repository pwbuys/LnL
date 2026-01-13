import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChangeDetectionStrategy } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { UserProgressService } from '../../../services/user-progress.service';
import { MathSettingsService } from '../../../services/math-settings.service';

@Component({
  selector: 'app-user-selector',
  imports: [ReactiveFormsModule],
  template: `
    <div class="user-selector">
      <button
        type="button"
        class="user-button"
        (click)="toggleDropdown()"
        [attr.aria-expanded]="showDropdown()"
        [attr.aria-label]="'Current user: ' + currentUser() + ', click to switch user'"
      >
        <span class="user-icon">👤</span>
        <span class="user-name">{{ currentUser() }}</span>
        <span class="dropdown-arrow" [class.open]="showDropdown()">▼</span>
      </button>

      @if (showDropdown()) {
        <div class="dropdown-menu" role="menu">
          <div class="dropdown-header">Users</div>
          
          @for (user of users(); track user.name) {
            <div class="user-option-wrapper">
              <button
                type="button"
                class="user-option"
                [class.active]="user.name === currentUser()"
                (click)="switchUser(user.name)"
                role="menuitem"
              >
                <span class="user-option-name">{{ user.name }}</span>
                @if (user.name === currentUser()) {
                  <span class="checkmark">✓</span>
                }
              </button>
              @if (canDeleteUser(user.name)) {
                <button
                  type="button"
                  class="delete-user-button"
                  (click)="deleteUser(user.name, $event)"
                  [attr.aria-label]="'Delete user ' + user.name"
                  title="Delete user"
                >
                  ✕
                </button>
              }
            </div>
          }

          <div class="divider"></div>

          <form [formGroup]="newUserForm" (ngSubmit)="createUser()" class="new-user-form">
            <input
              type="text"
              formControlName="userName"
              class="new-user-input"
              placeholder="New user name"
              (keydown.escape)="closeDropdown()"
              aria-label="New user name"
            />
            <button
              type="submit"
              class="create-button"
              [disabled]="newUserForm.invalid"
              aria-label="Create new user"
            >
              Create
            </button>
          </form>

          @if (newUserForm.get('userName')?.invalid && newUserForm.get('userName')?.touched) {
            <div class="error-message">
              @if (newUserForm.get('userName')?.errors?.['required']) {
                User name is required
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .user-selector {
      position: relative;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--user-button-bg, #f5f5f5);
      border: 2px solid var(--user-button-border, #e0e0e0);
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #333);
      min-height: 44px;
      transition: all 0.2s ease;
    }

    .user-button:hover {
      background: var(--user-button-hover, #e0e0e0);
      border-color: var(--user-button-hover-border, #ccc);
    }

    .user-icon {
      font-size: 1.25rem;
    }

    .user-name {
      flex: 1;
      text-align: left;
    }

    .dropdown-arrow {
      font-size: 0.75rem;
      transition: transform 0.2s ease;
    }

    .dropdown-arrow.open {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 200px;
      background: var(--dropdown-bg, #fff);
      border: 2px solid var(--dropdown-border, #e0e0e0);
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      max-height: 400px;
      overflow-y: auto;
    }

    .dropdown-header {
      padding: 0.75rem 1rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
      border-bottom: 1px solid var(--dropdown-border, #e0e0e0);
    }

    .user-option-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 0.5rem;
    }

    .user-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-primary, #333);
      transition: background 0.2s ease;
      min-height: 44px;
      border-radius: 0.25rem;
    }

    .user-option:hover {
      background: var(--user-option-hover, #f5f5f5);
    }

    .user-option.active {
      background: var(--user-option-active, #e3f2fd);
      color: var(--user-option-active-text, #1976d2);
    }

    .user-option-name {
      flex: 1;
    }

    .checkmark {
      color: var(--success-color, #4caf50);
      font-weight: 700;
    }

    .divider {
      height: 1px;
      background: var(--dropdown-border, #e0e0e0);
      margin: 0.5rem 0;
    }

    .new-user-form {
      padding: 0.75rem 1rem;
      display: flex;
      gap: 0.5rem;
    }

    .new-user-input {
      flex: 1;
      padding: 0.5rem;
      border: 2px solid var(--input-border, #ccc);
      border-radius: 0.25rem;
      font-size: 0.875rem;
      min-height: 36px;
    }

    .new-user-input:focus {
      outline: none;
      border-color: var(--input-focus-border, #4caf50);
    }

    .create-button {
      padding: 0.5rem 1rem;
      background: var(--button-primary-bg, #4caf50);
      color: var(--button-primary-text, #fff);
      border: none;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      min-height: 36px;
      transition: background 0.2s ease;
    }

    .create-button:hover:not(:disabled) {
      background: var(--button-primary-hover, #45a049);
    }

    .create-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .delete-user-button {
      width: 28px;
      height: 28px;
      border: none;
      background: var(--delete-bg, #f44336);
      color: #fff;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .delete-user-button:hover {
      background: var(--delete-hover, #d32f2f);
      transform: scale(1.1);
    }

    .delete-user-button:active {
      transform: scale(0.95);
    }

    .error-message {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      color: var(--error-color, #f44336);
    }

    @media (prefers-color-scheme: dark) {
      .user-selector {
        --user-button-bg: #2a2a2a;
        --user-button-border: #444;
        --user-button-hover: #333;
        --user-button-hover-border: #555;
        --text-primary: #fff;
        --text-secondary: #aaa;
        --dropdown-bg: #2a2a2a;
        --dropdown-border: #444;
        --user-option-hover: #333;
        --user-option-active: #1e3a5f;
        --user-option-active-text: #64b5f6;
        --input-border: #555;
        --input-focus-border: #4caf50;
        --button-primary-bg: #4caf50;
        --button-primary-hover: #45a049;
        --button-primary-text: #fff;
        --success-color: #4caf50;
        --error-color: #f44336;
        --delete-bg: #f44336;
        --delete-hover: #d32f2f;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSelectorComponent {
  private readonly userService = inject(UserService);
  private readonly userProgressService = inject(UserProgressService);
  private readonly settingsService = inject(MathSettingsService);
  private readonly fb = inject(FormBuilder);

  readonly users = this.userService.users;
  readonly currentUser = this.userService.currentUser;
  readonly showDropdown = signal<boolean>(false);
  readonly newUserForm: FormGroup;

  constructor() {
    this.newUserForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  toggleDropdown(): void {
    this.showDropdown.update(value => !value);
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
    this.newUserForm.reset();
  }

  switchUser(userName: string): void {
    this.userService.switchUser(userName);
    this.closeDropdown();
  }

  createUser(): void {
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }

    const userName = this.newUserForm.get('userName')?.value?.trim();
    if (!userName) {
      return;
    }

    const success = this.userService.createUser(userName);
    if (success) {
      // Initialize empty progress and settings for new user
      this.userProgressService.initializeUserProgress(userName);
      this.settingsService.initializeUserSettings(userName);
      
      // Switch to new user
      this.userService.switchUser(userName);
      this.newUserForm.reset();
      this.closeDropdown();
    } else {
      // User already exists or invalid name
      this.newUserForm.get('userName')?.setErrors({ duplicate: true });
    }
  }

  canDeleteUser(userName: string): boolean {
    // Can delete if there's more than one user
    return this.users().length > 1;
  }

  deleteUser(userName: string, event: Event): void {
    event.stopPropagation(); // Prevent switching user when clicking delete
    
    if (!this.canDeleteUser(userName)) {
      return;
    }

    const confirmMessage = `Are you sure you want to delete user "${userName}"? This will permanently delete all their progress and settings. This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      // Delete all user data (progress and settings) before deleting the user
      this.userProgressService.deleteUserProgress(userName);
      this.settingsService.deleteUserSettings(userName);
      
      // Delete the user (this will also switch to another user if needed)
      const success = this.userService.deleteUser(userName);
      if (!success) {
        alert(`Cannot delete user "${userName}". You must have at least one user.`);
      }
    }
  }
}

