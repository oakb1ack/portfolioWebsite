import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-admin-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="admin-state"
      [class.admin-state--error]="tone() === 'error'"
      [class.admin-state--success]="tone() === 'success'"
      [attr.role]="tone() === 'error' ? 'alert' : 'status'"
      aria-live="polite"
    >
      <p>{{ message() }}</p>
      @if (retryable()) {
        <button type="button" class="admin-button admin-button--quiet" (click)="retry.emit()">
          Try again
        </button>
      }
    </div>
  `,
})
export class AdminStateComponent {
  readonly message = input.required<string>();
  readonly tone = input<'info' | 'error' | 'success'>('info');
  readonly retryable = input(false);
  readonly retry = output<void>();
}
