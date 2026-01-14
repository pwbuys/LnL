import { Component, output } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

export type KeypadButton = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'enter' | 'backspace';

@Component({
  selector: 'app-numeric-keypad',
  imports: [],
  host: {
    style: 'display: block; width: 100%; max-width: 600px;'
  },
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
      gap: 0;
      padding: 0;
      background: var(--keypad-bg, #2a2a2a);
      max-height: 100%;
      overflow: hidden;
      width: 100%;
      max-width: 600px;
      box-sizing: border-box;
      height: 100%;
    }

    .keypad-row {
      display: flex;
      gap: 0;
      flex: 1;
      min-height: 0;
    }

    .keypad-button {
      flex: 1;
      border: none;
      border-right: 1px solid var(--keypad-border, #444);
      border-bottom: 1px solid var(--keypad-border, #444);
      background: var(--keypad-button-bg, #333);
      color: var(--keypad-text, #fff);
      cursor: pointer;
      transition: background 0.1s ease;
      touch-action: manipulation;
      -webkit-tap-highlight-color: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: clamp(1.5rem, 5vh, 3rem);
      font-weight: 600;
      user-select: none;
      -webkit-user-select: none;
      text-align: center;
      min-width: 0;
    }

    .keypad-row:last-child .keypad-button {
      border-bottom: none;
    }

    .keypad-button:last-child {
      border-right: none;
    }

    .keypad-button:hover {
      background: var(--keypad-button-hover, #444);
    }

    .keypad-button:active {
      background: var(--keypad-button-active, #555);
    }

    .keypad-button:focus {
      outline: 2px solid var(--keypad-focus, #4caf50);
      outline-offset: -2px;
    }

    .keypad-button-enter {
      background: var(--keypad-enter-bg, #4caf50);
      color: var(--keypad-enter-text, #fff);
    }

    .keypad-button-enter:hover {
      background: var(--keypad-enter-hover, #45a049);
    }

    .keypad-button-enter:active {
      background: var(--keypad-enter-active, #3d8b40);
    }

    @media (prefers-color-scheme: light) {
      .keypad {
        --keypad-bg: #e0e0e0;
        --keypad-border: #ccc;
        --keypad-button-bg: #f5f5f5;
        --keypad-text: #333;
        --keypad-button-hover: #e0e0e0;
        --keypad-button-active: #d0d0d0;
        --keypad-focus: #4caf50;
      }
    }

    @media (prefers-color-scheme: dark) {
      .keypad {
        --keypad-bg: #2a2a2a;
        --keypad-border: #444;
        --keypad-button-bg: #333;
        --keypad-text: #fff;
        --keypad-button-hover: #444;
        --keypad-button-active: #555;
        --keypad-focus: #4caf50;
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

