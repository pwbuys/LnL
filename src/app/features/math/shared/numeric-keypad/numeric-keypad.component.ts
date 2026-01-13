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
      gap: 0.75rem;
      padding: 1rem;
      background: var(--keypad-bg, #f5f5f5);
      border-radius: 0.5rem;
    }

    .keypad-row {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }

    .keypad-button {
      min-width: 3rem;
      min-height: 3rem;
      font-size: 1.5rem;
      font-weight: 600;
      border: 2px solid var(--keypad-border, #ccc);
      border-radius: 0.5rem;
      background: var(--keypad-button-bg, #fff);
      color: var(--keypad-text, #333);
      cursor: pointer;
      transition: all 0.2s ease;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
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

