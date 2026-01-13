import { Component, output } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

export type KeypadButton = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'enter' | 'backspace';

@Component({
  selector: 'app-numeric-keypad',
  imports: [],
  template: `
    <div class="keypad" role="group" aria-label="Numeric keypad">
      <div class="keypad-row">
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('7')"
          aria-label="Seven"
        >
          7
        </button>
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('8')"
          aria-label="Eight"
        >
          8
        </button>
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('9')"
          aria-label="Nine"
        >
          9
        </button>
      </div>
      <div class="keypad-row">
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('4')"
          aria-label="Four"
        >
          4
        </button>
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('5')"
          aria-label="Five"
        >
          5
        </button>
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('6')"
          aria-label="Six"
        >
          6
        </button>
      </div>
      <div class="keypad-row">
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('1')"
          aria-label="One"
        >
          1
        </button>
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('2')"
          aria-label="Two"
        >
          2
        </button>
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('3')"
          aria-label="Three"
        >
          3
        </button>
      </div>
      <div class="keypad-row">
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('backspace')"
          aria-label="Backspace"
        >
          ⌫
        </button>
        <button
          type="button"
          class="keypad-button"
          (click)="onButtonClick('0')"
          aria-label="Zero"
        >
          0
        </button>
        <button
          type="button"
          class="keypad-button keypad-button-enter"
          (click)="onButtonClick('enter')"
          aria-label="Enter"
        >
          ✓
        </button>
      </div>
    </div>
  `,
  styles: `
    .keypad {
      display: flex;
      flex-direction: column;
      gap: clamp(0.5rem, 1.5vh, 1rem);
      padding: clamp(0.75rem, 2vh, 1.5rem);
      background: var(--keypad-bg, #f5f5f5);
      border-radius: 0.5rem;
      max-height: 100%;
      overflow: hidden;
      width: fit-content;
      max-width: 100%;
      box-sizing: border-box;
      height: 100%;
      margin: 0 auto;
    }

    .keypad-row {
      display: flex;
      gap: clamp(0.5rem, 1.5vh, 1rem);
      justify-content: center;
      flex: 1;
      min-height: 0;
    }

    .keypad-button {
      /* Use the smaller of viewport width or height to prevent overflow on wide screens */
      /* Scale based on viewport height primarily, with width as secondary constraint */
      width: clamp(3rem, min(12vw, 10vh), 6rem);
      height: clamp(3rem, min(12vw, 10vh), 6rem);
      /* Ensure buttons don't exceed container */
      max-width: 100%;
      max-height: 100%;
      /* Font size scales proportionally */
      font-size: clamp(1.25rem, min(4vw, 3.5vh), 2.5rem);
      font-weight: 600;
      border: 2px solid var(--keypad-border, #ccc);
      border-radius: 0.5rem;
      background: var(--keypad-button-bg, #fff);
      color: var(--keypad-text, #333);
      cursor: pointer;
      transition: all 0.2s ease;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      flex-shrink: 1;
      flex-grow: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .keypad-button:hover {
      background: var(--keypad-button-hover, #e0e0e0);
      transform: scale(1.05);
    }

    .keypad-button:active {
      transform: scale(0.95);
      background: var(--keypad-button-active, #d0d0d0);
    }

    .keypad-button-enter {
      background: var(--keypad-enter-bg, #4caf50);
      color: var(--keypad-enter-text, #fff);
      border-color: var(--keypad-enter-border, #45a049);
    }

    .keypad-button-enter:hover {
      background: var(--keypad-enter-hover, #45a049);
    }

    .keypad-button-enter:active {
      background: var(--keypad-enter-active, #3d8b40);
    }

    @media (prefers-color-scheme: dark) {
      .keypad {
        --keypad-bg: #2a2a2a;
        --keypad-border: #444;
        --keypad-button-bg: #333;
        --keypad-text: #fff;
        --keypad-button-hover: #444;
        --keypad-button-active: #555;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NumericKeypadComponent {
  readonly buttonClick = output<KeypadButton>();

  onButtonClick(button: KeypadButton): void {
    this.buttonClick.emit(button);
  }
}

