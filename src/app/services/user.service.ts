import { Injectable, signal, effect } from '@angular/core';

const STORAGE_KEY_USERS = 'school-helper-users';
const STORAGE_KEY_CURRENT_USER = 'school-helper-current-user';
const DEFAULT_USER_NAME = 'Default';

export interface User {
  name: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  readonly users = signal<User[]>([]);
  readonly currentUser = signal<string | null>(null);

  constructor() {
    this.initializeUsers();
    
    // Save current user to localStorage whenever it changes
    effect(() => {
      const user = this.currentUser();
      if (user) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, user);
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    });
  }

  /**
   * Initialize users from localStorage or create default user
   */
  private initializeUsers(): void {
    const savedUsers = this.loadUsers();
    const savedCurrentUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);

    if (savedUsers.length === 0) {
      // No users exist, create default user
      const defaultUser: User = {
        name: DEFAULT_USER_NAME,
        createdAt: new Date()
      };
      this.users.set([defaultUser]);
      this.currentUser.set(DEFAULT_USER_NAME);
      this.saveUsers();
    } else {
      this.users.set(savedUsers);
      // Set current user to saved one, or first user if none saved
      const currentUser = savedCurrentUser || savedUsers[0].name;
      if (savedUsers.some(u => u.name === currentUser)) {
        this.currentUser.set(currentUser);
      } else {
        this.currentUser.set(savedUsers[0].name);
      }
    }
  }

  /**
   * Load users from localStorage
   */
  private loadUsers(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored) as Array<Omit<User, 'createdAt'> & { createdAt: string }>;
      return parsed.map(user => ({
        ...user,
        createdAt: new Date(user.createdAt)
      }));
    } catch (error) {
      console.error('Error loading users from localStorage:', error);
      return [];
    }
  }

  /**
   * Save users to localStorage
   */
  private saveUsers(): void {
    try {
      const serializable = this.users().map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString()
      }));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving users to localStorage:', error);
    }
  }

  /**
   * Create a new user
   */
  createUser(name: string): boolean {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return false;
    }

    // Check if user already exists
    if (this.users().some(u => u.name === trimmedName)) {
      return false;
    }

    const newUser: User = {
      name: trimmedName,
      createdAt: new Date()
    };

    this.users.set([...this.users(), newUser]);
    this.saveUsers();
    return true;
  }

  /**
   * Switch to a different user
   */
  switchUser(userName: string): boolean {
    const userExists = this.users().some(u => u.name === userName);
    if (userExists) {
      this.currentUser.set(userName);
      return true;
    }
    return false;
  }

  /**
   * Delete a user
   * Note: This only removes the user from the list. 
   * Call UserProgressService.deleteUserProgress() and MathSettingsService.deleteUserSettings() 
   * separately to delete all user data.
   */
  deleteUser(userName: string): boolean {
    if (userName === DEFAULT_USER_NAME && this.users().length === 1) {
      // Cannot delete the last user (default user)
      return false;
    }

    const updatedUsers = this.users().filter(u => u.name !== userName);
    if (updatedUsers.length === this.users().length) {
      return false; // User not found
    }

    // Remove user from list
    this.users.set(updatedUsers);
    this.saveUsers();

    // If deleted user was current, switch to first available user
    if (this.currentUser() === userName) {
      this.currentUser.set(updatedUsers[0].name);
    }

    return true;
  }

  /**
   * Get current user name
   */
  getCurrentUserName(): string | null {
    return this.currentUser();
  }
}

