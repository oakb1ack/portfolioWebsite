import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CONTACT_EMAIL, contactLinks } from './contact.data';

type EmailCopyState = 'idle' | 'copied' | 'error';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  private readonly document = inject(DOCUMENT);
  private readonly emailCopyState = signal<EmailCopyState>('idle');
  private copyResetTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly contactLinks = contactLinks;
  protected readonly isEmailCopied = computed(() => this.emailCopyState() === 'copied');
  protected readonly emailCopyMessage = computed(() => {
    switch (this.emailCopyState()) {
      case 'copied':
        return 'Email address copied to your clipboard.';
      case 'error':
        return `Unable to copy the email address. It is ${CONTACT_EMAIL}.`;
      default:
        return '';
    }
  });

  protected async copyEmailAddress(): Promise<void> {
    const copied = await this.copyToClipboard(CONTACT_EMAIL);
    this.emailCopyState.set(copied ? 'copied' : 'error');

    if (copied) {
      this.resetCopyFeedback();
    }
  }

  private async copyToClipboard(value: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(value);
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
}
