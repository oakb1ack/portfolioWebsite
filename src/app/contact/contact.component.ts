import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, startWith, Subject, switchMap, tap } from 'rxjs';
import { ContactLinksApiService, PublicApiError, PublicContactLink } from '../core/public-api';

type EmailCopyState = 'idle' | 'copied' | 'error';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  private readonly api = inject(ContactLinksApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly emailCopyState = signal<EmailCopyState>('idle');
  private readonly failedEmailAddress = signal('');
  private readonly retryRequest = new Subject<void>();
  private copyResetTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly contactLinks = signal<PublicContactLink[]>([]);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly isLoading = signal(true);
  protected readonly isEmailCopied = computed(() => this.emailCopyState() === 'copied');
  protected readonly emailCopyMessage = computed(() => {
    switch (this.emailCopyState()) {
      case 'copied':
        return 'Email address copied to your clipboard.';
      case 'error':
        return `Unable to copy the email address. It is ${this.failedEmailAddress()}.`;
      default:
        return '';
    }
  });

  constructor() {
    this.retryRequest
      .pipe(
        startWith(undefined),
        tap(() => {
          this.isLoading.set(true);
          this.error.set(undefined);
        }),
        switchMap(() =>
          this.api.list().pipe(
            tap((links) =>
              this.contactLinks.set(
                [...links].sort((first, second) => first.sort_order - second.sort_order),
              ),
            ),
            catchError((error: unknown) => {
              this.contactLinks.set([]);
              this.error.set(this.errorMessage(error));
              return EMPTY;
            }),
            finalize(() => this.isLoading.set(false)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.destroyRef.onDestroy(() => {
      if (this.copyResetTimer) {
        clearTimeout(this.copyResetTimer);
      }
    });
  }

  protected async copyEmailAddress(link: PublicContactLink): Promise<void> {
    const address = this.emailAddress(link);
    const copied = await this.copyToClipboard(address);
    this.failedEmailAddress.set(copied ? '' : address);
    this.emailCopyState.set(copied ? 'copied' : 'error');

    if (copied) {
      this.resetCopyFeedback();
    }
  }

  protected emailAddress(link: PublicContactLink): string {
    return link.url.replace(/^mailto:/i, '').split('?')[0];
  }

  protected retry(): void {
    this.retryRequest.next();
  }

  private async copyToClipboard(value: string): Promise<boolean> {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      return this.copyWithFallback(value);
    }

    try {
      await clipboard.writeText(value);
      return true;
    } catch {
      return this.copyWithFallback(value);
    }
  }

  private copyWithFallback(value: string): boolean {
    const textarea = this.document.createElement('textarea');
    textarea.setAttribute('readonly', '');
    textarea.value = value;
    textarea.style.opacity = '0';
    textarea.style.position = 'fixed';
    textarea.style.pointerEvents = 'none';

    this.document.body.append(textarea);
    textarea.select();

    const copied = this.document.execCommand('copy');
    textarea.remove();

    return copied;
  }

  private resetCopyFeedback(): void {
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }

    this.copyResetTimer = setTimeout(() => this.emailCopyState.set('idle'), 2400);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof PublicApiError && error.status === 503) {
      return 'Contact details are temporarily unavailable. Please try again shortly.';
    }

    return 'Contact details could not be loaded. Check your connection and try again.';
  }
}
