import {
  Component,
  computed,
  effect,
  inject,
  signal,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';
import { MathStateService } from '../../../services/math-state.service';
import { ExerciseEngineService } from '../../../services/exercise-engine.service';
import { MathCard } from '../../../models/math-card.model';
import { NumericKeypadComponent, KeypadButton } from '../shared/numeric-keypad/numeric-keypad.component';
import { ProgressIndicatorComponent } from '../shared/progress-indicator/progress-indicator.component';

type FeedbackType = 'none' | 'correct' | 'incorrect' | 'slow';

@Component({
  selector: 'app-exercise',
  imports: [NumericKeypadComponent, ProgressIndicatorComponent],
  template: `
    <div class="exercise-container">
      <header class="exercise-header">
        <button
          type="button"
          class="exit-button"
          (click)="endSession()"
          aria-label="Exit session"
        >
          ✕
        </button>
        <div class="header-content">
          <h2 class="set-name">{{ currentSet()?.name }}</h2>
          @if (currentSet()) {
            <app-progress-indicator [cards]="getCardsWithProgress()" />
          }
        </div>
      </header>

      @if (currentCard()) {
        <div
          class="question-container"
          [class.correct-feedback]="feedback() === 'correct'"
          [class.incorrect-feedback]="feedback() === 'incorrect'"
          [class.slow-feedback]="feedback() === 'slow'"
        >
          <div class="question-display">
            <p class="question-text">{{ currentCard()!.question }}</p>
            <div class="answer-display">
              <span class="answer-value">{{ answerInput() || '?' }}</span>
            </div>
            @if (feedback() === 'slow') {
              <div class="slow-indicator" aria-live="polite">
                <span class="turtle-icon">🐢</span>
                <span class="slow-text">Too slow!</span>
              </div>
            }
          </div>
        </div>

        <div class="keypad-container">
          <app-numeric-keypad (buttonClick)="onKeypadClick($event)" />
        </div>
      } @else {
        <div class="loading">Loading...</div>
      }
    </div>
  `,
  styles: `
    .exercise-container {
      min-height: 100vh; /* Fallback for older browsers */
      min-height: 100dvh; /* Dynamic viewport height - accounts for mobile browser UI */
      display: flex;
      flex-direction: column;
      background: var(--bg-primary, #fff);
      color: var(--text-primary, #333);
    }

    .exercise-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      gap: 1rem;
    }

    .header-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: 0;
    }

    .exit-button {
      width: 44px;
      height: 44px;
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: var(--text-primary, #333);
      cursor: pointer;
      border-radius: 0.5rem;
      transition: background 0.2s ease;
    }

    .exit-button:hover {
      background: var(--button-hover-bg, #f0f0f0);
    }

    .set-name {
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      margin: 0;
      color: var(--text-secondary, #666);
    }

    .header-content app-progress-indicator {
      width: 100%;
    }

    .question-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      transition: all 0.3s ease;
      max-height: 40vh;
      min-height: 0;
      overflow: hidden;
    }

    .question-display {
      text-align: center;
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      max-height: 100%;
      overflow: hidden;
    }

    .question-text {
      font-size: clamp(2rem, min(8vw, 6vh), 5rem);
      font-weight: 700;
      margin: 0 0 clamp(1rem, 2vh, 2rem) 0;
      color: var(--text-primary, #333);
      line-height: 1.2;
      flex-shrink: 1;
    }

    .answer-display {
      margin-bottom: clamp(0.5rem, 1vh, 1rem);
      flex-shrink: 1;
    }

    .answer-value {
      font-size: clamp(1.5rem, min(5vw, 4vh), 3.5rem);
      font-weight: 600;
      color: var(--answer-color, #4caf50);
      min-height: clamp(2rem, 4vh, 4rem);
      display: inline-block;
    }

    .slow-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      color: var(--slow-color, #ff9800);
    }

    .turtle-icon {
      font-size: 3rem;
    }

    .slow-text {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .keypad-container {
      padding: 0;
      background: var(--keypad-container-bg, #f5f5f5);
      flex-shrink: 0;
      overflow: hidden;
      /* Limit keypad to 40% of viewport height, ensuring space for question */
      height: min(40vh, 400px);
      min-height: 200px;
      display: flex;
      align-items: stretch;
      justify-content: center;
    }

    .loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: var(--text-secondary, #666);
    }

    /* Feedback Animations */
    .correct-feedback {
      animation: correctFlash 0.5s ease;
    }

    .incorrect-feedback {
      animation: incorrectShake 0.5s ease;
    }

    .slow-feedback {
      animation: slowPulse 0.5s ease;
    }

    @keyframes correctFlash {
      0% {
        background: var(--bg-primary, #fff);
      }
      50% {
        background: var(--correct-bg, #c8e6c9);
      }
      100% {
        background: var(--bg-primary, #fff);
      }
    }

    @keyframes incorrectShake {
      0%,
      100% {
        transform: translateX(0);
      }
      10%,
      30%,
      50%,
      70%,
      90% {
        transform: translateX(-10px);
        background: var(--incorrect-bg, #ffcdd2);
      }
      20%,
      40%,
      60%,
      80% {
        transform: translateX(10px);
        background: var(--incorrect-bg, #ffcdd2);
      }
    }

    @keyframes slowPulse {
      0%,
      100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }

    @media (prefers-color-scheme: dark) {
      .exercise-container {
        --bg-primary: #1a1a1a;
        --text-primary: #fff;
        --text-secondary: #aaa;
        --border-color: #444;
        --button-hover-bg: #333;
        --keypad-container-bg: #2a2a2a;
        --correct-bg: #2e7d32;
        --incorrect-bg: #c62828;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExerciseComponent implements OnInit, OnDestroy {
  private readonly mathStateService = inject(MathStateService);
  private readonly exerciseEngine = inject(ExerciseEngineService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly currentSet = this.mathStateService.currentSet;
  readonly currentCard = signal<MathCard | null>(null);
  readonly answerInput = signal<string>('');
  readonly feedback = signal<FeedbackType>('none');
  readonly questionStartTime = signal<number>(0);

  readonly getCardsWithProgress = computed(() => {
    const set = this.currentSet();
    if (!set) {
      return [];
    }
    return this.mathStateService.getCardsWithProgress(set);
  });

  private feedbackTimeoutId: number | null = null;
  private currentSetId: string | null = null;
  private isLoadingNextCard = false;

  constructor() {
    // Watch for set changes and load next card only when set ID changes
    effect(() => {
      const set = this.currentSet();
      if (set && set.cards.length > 0) {
        // Only load next card if the set ID actually changed (not just card updates)
        if (this.currentSetId !== set.id) {
          this.currentSetId = set.id;
          this.loadNextCard();
        }
      }
    });
  }

  ngOnInit(): void {
    const setId = this.route.snapshot.paramMap.get('setId');
    if (setId) {
      this.mathStateService.setCurrentSet(setId);
      this.mathStateService.startSession();
    } else {
      this.router.navigate(['/math']);
    }
  }

  ngOnDestroy(): void {
    this.clearTimeouts();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Allow input during incorrect feedback, but block during correct/slow feedback
    const currentFeedback = this.feedback();
    if (currentFeedback === 'correct' || currentFeedback === 'slow') {
      return;
    }
    
    // If feedback is incorrect and user starts typing, clear feedback immediately
    if (currentFeedback === 'incorrect') {
      this.feedback.set('none');
      // Clear any pending feedback timeout since user is retrying
      if (this.feedbackTimeoutId !== null) {
        clearTimeout(this.feedbackTimeoutId);
        this.feedbackTimeoutId = null;
      }
    }

    // Handle number keys (0-9)
    if (event.key >= '0' && event.key <= '9') {
      event.preventDefault();
      this.onKeypadClick(event.key as KeypadButton);
      return;
    }

    // Handle Enter key
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onKeypadClick('enter');
      return;
    }

    // Handle Backspace key
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.onKeypadClick('backspace');
      return;
    }
  }

  loadNextCard(): void {
    // Prevent concurrent calls
    if (this.isLoadingNextCard) {
      return;
    }

    this.isLoadingNextCard = true;
    const set = this.currentSet();
    if (!set) {
      this.isLoadingNextCard = false;
      return;
    }

    // Get cards with user progress merged
    const cardsWithProgress = this.mathStateService.getCardsWithProgress(set);
    
    // Get next card, excluding the current card to prevent same question twice in a row
    const currentCardId = this.currentCard()?.id;
    const nextCard = this.exerciseEngine.getNextCard(cardsWithProgress, currentCardId);
    if (nextCard) {
      this.currentCard.set(nextCard);
      this.answerInput.set('');
      this.feedback.set('none');
      this.questionStartTime.set(Date.now());
    }
    this.isLoadingNextCard = false;
  }

  onKeypadClick(button: KeypadButton): void {
    const currentFeedback = this.feedback();
    // Allow input during incorrect feedback, but block during correct/slow feedback
    if (currentFeedback === 'correct' || currentFeedback === 'slow') {
      return;
    }
    
    // If feedback is incorrect and user starts typing, clear feedback immediately
    if (currentFeedback === 'incorrect') {
      this.feedback.set('none');
      // Clear any pending feedback timeout since user is retrying
      if (this.feedbackTimeoutId !== null) {
        clearTimeout(this.feedbackTimeoutId);
        this.feedbackTimeoutId = null;
      }
    }

    if (button === 'enter') {
      this.submitAnswer();
    } else if (button === 'backspace') {
      this.answerInput.update(value => value.slice(0, -1));
    } else {
      // Number button
      this.answerInput.update(value => value + button);
    }
  }

  submitAnswer(): void {
    const card = this.currentCard();
    if (!card) {
      return;
    }

    const answerValue = parseInt(this.answerInput(), 10);
    if (isNaN(answerValue)) {
      return;
    }

    const timeTaken = Date.now() - this.questionStartTime();
    const result = this.exerciseEngine.submitAnswer(card.id, answerValue, timeTaken);

    // Show feedback
    if (result.isCorrect && result.isFast) {
      this.feedback.set('correct');
    } else if (result.isCorrect && result.isSlow) {
      this.feedback.set('slow');
    } else {
      this.feedback.set('incorrect');
    }

    // If answer is correct, advance immediately
    if (result.isCorrect) {
      // Brief delay to show feedback, then advance
      this.feedbackTimeoutId = window.setTimeout(() => {
        this.feedback.set('none');
        this.loadNextCard();
      }, 500);
    } else {
      // For incorrect answers: clear input, show feedback, but don't advance
      this.answerInput.set(''); // Clear input for retry
      this.feedbackTimeoutId = window.setTimeout(() => {
        this.feedback.set('none');
        // Reset timer for fresh attempt
        this.questionStartTime.set(Date.now());
      }, 1500);
      // NO auto-advance - user must answer correctly to continue
    }
  }

  endSession(): void {
    this.clearTimeouts();
    this.mathStateService.endSession();
    this.router.navigate(['/math/summary']);
  }

  private clearTimeouts(): void {
    if (this.feedbackTimeoutId !== null) {
      clearTimeout(this.feedbackTimeoutId);
      this.feedbackTimeoutId = null;
    }
  }
}

