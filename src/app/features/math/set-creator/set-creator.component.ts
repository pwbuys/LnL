import { Component, inject, signal, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormArray,
  AbstractControl
} from '@angular/forms';
import { ChangeDetectionStrategy } from '@angular/core';
import { MathStateService } from '../../../services/math-state.service';
import { parseMathExpression } from '../shared/utils/math-parser.util';
import { MathCard } from '../../../models/math-card.model';

interface ProblemEntry {
  input: string;
  parsed: { question: string; answer: number } | null;
  error: string | null;
}

@Component({
  selector: 'app-set-creator',
  imports: [ReactiveFormsModule],
  template: `
    <div class="set-creator">
      <header class="header">
        <button
          type="button"
          class="back-button"
          (click)="goBack()"
          aria-label="Go back"
        >
          ← Back
        </button>
        <h1>{{ isEditMode() ? 'Edit Math Set' : 'Create Math Set' }}</h1>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form">
        <div class="form-group">
          <label for="setName" class="label">Set Name</label>
          <input
            id="setName"
            type="text"
            formControlName="setName"
            class="input"
            placeholder="e.g., Hard 8s"
            aria-required="true"
            aria-describedby="setNameError"
          />
          @if (form.get('setName')?.invalid && form.get('setName')?.touched) {
            <span id="setNameError" class="error">Set name is required</span>
          }
        </div>

        <div class="form-group">
          <label class="label">Math Problems</label>
          <p class="hint">Enter problems like: 3x5, 4 x 6, 8*7</p>

          <div formArrayName="problems" class="problems-list">
            @for (
              problem of problemsArray.controls;
              track $index;
              let i = $index
            ) {
              <div class="problem-entry" [formGroupName]="i">
                <input
                  #problemInput
                  type="text"
                  formControlName="input"
                  class="problem-input"
                  [placeholder]="'e.g., ' + ($index === 0 ? '3x5' : '4x6')"
                  (blur)="onProblemBlur(i)"
                  (input)="clearError(i)"
                  (keydown)="onProblemInputKeydown($event, i)"
                  [attr.data-problem-index]="i"
                />
                @if (problemEntries()[i]?.error) {
                  <span class="error">{{ problemEntries()[i].error }}</span>
                }
                @if (problemEntries()[i]?.parsed) {
                  <span class="parsed-info">
                    {{ problemEntries()[i].parsed!.question }} = {{ problemEntries()[i].parsed!.answer }}
                  </span>
                }
                @if (problemsArray.length > 1) {
                  <button
                    type="button"
                    class="remove-button"
                    (click)="removeProblem(i)"
                    aria-label="Remove problem"
                  >
                    ✕
                  </button>
                }
              </div>
            }
          </div>


          @if (form.get('problems')?.invalid && form.get('problems')?.touched) {
            <span class="error">At least one valid problem is required</span>
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
            {{ isEditMode() ? 'Save Changes' : 'Create Set' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .set-creator {
      min-height: 100vh; /* Fallback for older browsers */
      min-height: 100dvh; /* Dynamic viewport height - accounts for mobile browser UI */
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

    .input,
    .problem-input {
      width: 100%;
      padding: 0.75rem;
      font-size: 1rem;
      border: 2px solid var(--input-border, #ccc);
      border-radius: 0.5rem;
      background: var(--input-bg, #fff);
      color: var(--text-primary, #333);
      min-height: 44px;
    }

    .input:focus,
    .problem-input:focus {
      outline: none;
      border-color: var(--input-focus-border, #4caf50);
    }

    .problems-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }

    .problem-entry {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      position: relative;
    }

    .parsed-info {
      font-size: 0.875rem;
      color: var(--success-color, #4caf50);
      font-weight: 600;
    }

    .error {
      font-size: 0.875rem;
      color: var(--error-color, #f44336);
    }

    .remove-button {
      position: absolute;
      right: 0.5rem;
      top: 0.5rem;
      width: 32px;
      height: 32px;
      border: none;
      background: var(--error-color, #f44336);
      color: #fff;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
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
      .set-creator {
        --bg-primary: #1a1a1a;
        --text-primary: #fff;
        --text-secondary: #aaa;
        --input-bg: #2a2a2a;
        --input-border: #444;
        --input-focus-border: #4caf50;
        --button-secondary-bg: #333;
        --button-secondary-border: #555;
        --button-secondary-hover: #444;
        --link-color: #4caf50;
        --success-color: #4caf50;
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
export class SetCreatorComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly mathStateService = inject(MathStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form: FormGroup;
  readonly problemEntries = signal<ProblemEntry[]>([]);
  readonly isEditMode = signal<boolean>(false);
  private editingSetId: string | null = null;

  @ViewChildren('problemInput') problemInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor() {
    this.form = this.fb.group({
      setName: ['', [Validators.required]],
      problems: this.fb.array([this.createProblemControl()], [this.atLeastOneValidProblem])
    });

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      const setId = params['setId'];
      if (setId) {
        this.isEditMode.set(true);
        this.editingSetId = setId;
        this.loadSetForEditing(setId);
      } else {
        this.isEditMode.set(false);
        this.editingSetId = null;
        // Initialize problem entries for new set
        this.updateProblemEntries();
      }
    });
  }

  loadSetForEditing(setId: string): void {
    const set = this.mathStateService.getSetById(setId);
    if (!set) {
      // Set not found, navigate back
      this.router.navigate(['/math']);
      return;
    }

    // Populate form with existing set data
    this.form.patchValue({
      setName: set.name
    });

    // Clear existing problems and add the set's cards
    while (this.problemsArray.length > 0) {
      this.problemsArray.removeAt(0);
    }

    set.cards.forEach(card => {
      // Convert card back to input format (e.g., "3 x 5" from question)
      const problemControl = this.createProblemControl();
      problemControl.patchValue({ input: card.question });
      this.problemsArray.push(problemControl);
    });

    // Validate all problems
    this.problemsArray.controls.forEach((_, index) => {
      this.validateProblem(index);
    });

    // Check if we already have an empty input at the end (validateProblem might have added one)
    const lastControl = this.problemsArray.at(this.problemsArray.length - 1);
    const lastInput = lastControl?.get('input')?.value || '';
    if (lastInput.trim()) {
      // Last input has content, so validateProblem didn't add one, add it now
      this.addProblem();
    }

    // Ensure entries array matches problemsArray length (validation already updated entries)
    const entries = this.problemEntries();
    while (entries.length < this.problemsArray.length) {
      entries.push({ input: '', parsed: null, error: null });
    }
    if (entries.length > this.problemsArray.length) {
      entries.splice(this.problemsArray.length);
    }
    this.problemEntries.set(entries);
  }

  get problemsArray(): FormArray {
    return this.form.get('problems') as FormArray;
  }

  createProblemControl(): FormGroup {
    return this.fb.group({
      input: [''] // No validators - validation is handled at the array level
    });
  }

  addProblem(): void {
    this.problemsArray.push(this.createProblemControl());
    // Add a new empty entry to problemEntries without resetting existing ones
    const existingEntries = [...this.problemEntries()];
    existingEntries.push({
      input: '',
      parsed: null,
      error: null
    });
    this.problemEntries.set(existingEntries);
    // Trigger change detection to ensure ViewChildren updates
    // The setTimeout in focusInput will handle the timing
  }

  removeProblem(index: number): void {
    if (this.problemsArray.length > 1) {
      this.problemsArray.removeAt(index);
      // Remove the corresponding entry from problemEntries
      const existingEntries = [...this.problemEntries()];
      existingEntries.splice(index, 1);
      this.problemEntries.set(existingEntries);
    }
  }

  validateProblem(index: number): void {
    const control = this.problemsArray.at(index);
    const input = control.get('input')?.value || '';
    const trimmedInput = input.trim();

    const entries = [...this.problemEntries()];
    
    // Ensure entries array is the same length as problemsArray
    while (entries.length < this.problemsArray.length) {
      entries.push({ input: '', parsed: null, error: null });
    }

    // Only validate if input is not empty
    if (!trimmedInput) {
      // Empty input - clear any previous errors/parsed data
      entries[index] = {
        input,
        parsed: null,
        error: null
      };
    } else {
      // Non-empty input - validate it
      const parsed = parseMathExpression(trimmedInput);

      if (!parsed) {
        entries[index] = {
          input,
          parsed: null,
          error: 'Invalid format. Use: 3x5, 4 x 6, or 8*7'
        };
      } else {
        // Check for duplicates (only check non-empty inputs)
        const duplicateIndex = this.problemsArray.controls.findIndex(
          (c, i) => {
            if (i === index) return false;
            const otherInput = c.get('input')?.value || '';
            if (!otherInput.trim()) return false; // Skip empty inputs
            const otherParsed = parseMathExpression(otherInput.trim());
            return otherParsed?.question === parsed.question;
          }
        );

        if (duplicateIndex !== -1) {
          entries[index] = {
            input,
            parsed: null,
            error: 'Duplicate problem'
          };
        } else {
          entries[index] = {
            input,
            parsed,
            error: null
          };
          
          // If this is the last input and has valid content, auto-add a new empty input
          if (index === this.problemsArray.length - 1) {
            this.addProblem();
            // After adding, update entries array length to match
            while (entries.length < this.problemsArray.length) {
              entries.push({ input: '', parsed: null, error: null });
            }
          }
        }
      }
    }

    this.problemEntries.set(entries);
    // Mark the problems array as touched so validators run
    this.problemsArray.markAsTouched();
    // Update form array validity - this will trigger the atLeastOneValidProblem validator
    this.problemsArray.updateValueAndValidity();
    // Also update parent form validity to ensure submit button state is correct
    this.form.updateValueAndValidity();
  }

  onProblemBlur(index: number): void {
    // Only validate if input is not empty
    const control = this.problemsArray.at(index);
    const input = control.get('input')?.value || '';
    if (input.trim()) {
      this.validateProblem(index);
    } else {
      // Clear error for empty input
      this.clearError(index);
    }
  }

  clearError(index: number): void {
    const entries = [...this.problemEntries()];
    // Ensure entries array is the same length as problemsArray
    while (entries.length < this.problemsArray.length) {
      entries.push({ input: '', parsed: null, error: null });
    }
    if (entries[index]) {
      entries[index] = { ...entries[index], error: null };
    } else {
      entries[index] = { input: '', parsed: null, error: null };
    }
    this.problemEntries.set(entries);
    // Update form validity when user starts typing (might fix validation)
    this.problemsArray.updateValueAndValidity();
    this.form.updateValueAndValidity();
  }

  updateProblemEntries(): void {
    // Preserve existing validation state when updating entries
    const existingEntries = this.problemEntries();
    const entries: ProblemEntry[] = this.problemsArray.controls.map((control, index) => {
      const input = control.get('input')?.value || '';
      // If we have an existing entry for this index, preserve its validation state if input hasn't changed
      const existing = existingEntries[index];
      if (existing && existing.input === input) {
        return existing;
      }
      // Otherwise, create a new entry (will be validated on blur)
      return {
        input,
        parsed: null,
        error: null
      };
    });
    this.problemEntries.set(entries);
  }

  atLeastOneValidProblem = (control: AbstractControl) => {
    const problems = control as FormArray;
    if (problems.length === 0) {
      return { noProblems: true };
    }

    // Check if any problem has a valid parsed expression (only check non-empty inputs)
    const hasValid = problems.controls.some(c => {
      const input = c.get('input')?.value || '';
      const trimmed = input.trim();
      if (!trimmed) {
        return false; // Empty input is not valid
      }
      const parsed = parseMathExpression(trimmed);
      return parsed !== null;
    });

    return hasValid ? null : { noValidProblems: true };
  };

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const setName = this.form.get('setName')?.value;
    const problems = this.problemsArray.controls
      .map(control => {
        const input = control.get('input')?.value || '';
        return parseMathExpression(input);
      })
      .filter((parsed): parsed is { question: string; answer: number } => parsed !== null);

    // Remove duplicates
    const uniqueProblems = Array.from(
      new Map(problems.map(p => [p.question, p])).values()
    );

    if (this.isEditMode() && this.editingSetId) {
      // Update existing set
      const existingSet = this.mathStateService.getSetById(this.editingSetId);
      if (!existingSet) {
        this.router.navigate(['/math']);
        return;
      }

      // Create cards, preserving IDs when questions match
      const cards = uniqueProblems.map((problem, index) => {
        // Try to find existing card with same question
        const existingCard = existingSet.cards.find(card => card.question === problem.question);
        
        if (existingCard) {
          // Preserve the existing card ID to maintain user progress
          return {
            id: existingCard.id,
            question: problem.question,
            answer: problem.answer
          };
        } else {
          // New card, generate new ID
          return {
            id: `${setName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
            question: problem.question,
            answer: problem.answer
          };
        }
      });

      // Update set
      this.mathStateService.updateSet(this.editingSetId, {
        name: setName,
        cards
      });
    } else {
      // Create new set
      const cards = uniqueProblems.map((problem, index) => ({
        id: `${setName.toLowerCase().replace(/\s+/g, '-')}-${index}`,
        question: problem.question,
        answer: problem.answer
      }));

      const now = new Date();
      const setId = `set-${Date.now()}`;
      const newSet = {
        id: setId,
        name: setName,
        cards,
        createdAt: now,
        updatedAt: now
      };

      this.mathStateService.addSet(newSet);
    }

    // Navigate back to set selection
    this.router.navigate(['/math']);
  }

  ngAfterViewInit(): void {
    // Ensure we have at least one input after view init
    if (this.problemsArray.length === 0) {
      this.addProblem();
    }
  }

  onProblemInputKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault();
      
      // If Enter, also validate the current problem
      if (event.key === 'Enter') {
        const input = this.problemsArray.at(index).get('input')?.value || '';
        if (input.trim()) {
          this.validateProblem(index);
        }
      }
      
      // Focus next input
      const nextIndex = index + 1;
      if (nextIndex < this.problemsArray.length) {
        // Focus next existing input
        setTimeout(() => this.focusInput(nextIndex), 10);
      } else {
        // On last input, add new one and focus it
        this.addProblem();
        // Use a slightly longer timeout to ensure DOM is updated and ViewChildren is refreshed
        setTimeout(() => this.focusInput(nextIndex), 50);
      }
    }
  }

  focusInput(index: number): void {
    // Try ViewChildren first, fallback to querySelector
    const inputs = this.problemInputs.toArray();
    if (inputs[index]) {
      inputs[index].nativeElement.focus();
    } else {
      // Fallback: use querySelector with data attribute
      const inputElement = document.querySelector(`[data-problem-index="${index}"]`) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/math']);
  }
}

