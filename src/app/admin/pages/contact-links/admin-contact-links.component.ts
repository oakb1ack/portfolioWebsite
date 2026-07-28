import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AdminErrorState, toAdminError } from '../../core/admin-error';
import { ContactLink, ContactLinkInput } from '../../core/admin.models';
import { AdminStateComponent } from '../../shared/admin-state.component';

@Component({
  selector: 'app-admin-contact-links',
  imports: [ReactiveFormsModule, AdminStateComponent],
  templateUrl: './admin-contact-links.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminContactLinksComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly links = signal<ContactLink[]>([]);
  readonly selected = signal<ContactLink | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly editorOpen = signal(false);
  readonly error = signal<AdminErrorState | null>(null);
  readonly notice = signal<string | null>(null);

  readonly form = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(80)]],
    kind: ['external' as ContactLinkInput['kind'], Validators.required],
    url: ['', Validators.required],
    iconKey: ['', [Validators.required, Validators.maxLength(80)]],
    sortOrder: [0],
    isVisible: [true],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listContactLinks().subscribe({
      next: (links) => {
        this.links.set([...links].sort((a, b) => a.sort_order - b.sort_order));
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toAdminError(error));
        this.loading.set(false);
      },
    });
  }

  create(): void {
    this.selected.set(null);
    this.form.reset({
      label: '',
      kind: 'external',
      url: '',
      iconKey: '',
      sortOrder: this.links().length,
      isVisible: true,
    });
    this.resetMessages();
    this.editorOpen.set(true);
  }

  edit(link: ContactLink): void {
    this.selected.set(link);
    this.form.reset({
      label: link.label,
      kind: link.kind,
      url: link.url,
      iconKey: link.icon_key,
      sortOrder: link.sort_order,
      isVisible: link.is_visible,
    });
    this.resetMessages();
    this.editorOpen.set(true);
  }

  close(): void {
    this.editorOpen.set(false);
    this.selected.set(null);
    this.resetMessages();
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const current = this.selected();
    const value = this.form.getRawValue();
    const input: ContactLinkInput = {
      label: value.label.trim(),
      kind: value.kind,
      url: value.url.trim(),
      icon_key: value.iconKey.trim(),
      sort_order: value.sortOrder,
      is_visible: value.isVisible,
      ...(current ? { expected_updated_at: current.updated_at } : {}),
    };
    this.saving.set(true);
    this.resetMessages();
    const request = current
      ? this.api.updateContactLink(current.id, input)
      : this.api.createContactLink(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.links.update((items) => {
          const exists = items.some((item) => item.id === saved.id);
          const next = exists
            ? items.map((item) => (item.id === saved.id ? saved : item))
            : [...items, saved];
          return next.sort((a, b) => a.sort_order - b.sort_order);
        });
        this.selected.set(saved);
        this.notice.set(current ? 'Contact link saved.' : 'Contact link created.');
      },
      error: (error: unknown) => this.error.set(toAdminError(error)),
    });
  }

  remove(link: ContactLink): void {
    if (this.deletingId() || !window.confirm(`Delete the “${link.label}” contact link?`)) {
      return;
    }
    this.deletingId.set(link.id);
    this.resetMessages();
    this.api
      .deleteContactLink(link.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.links.update((items) => items.filter((item) => item.id !== link.id));
          if (this.selected()?.id === link.id) {
            this.close();
          }
          this.notice.set('Contact link deleted.');
        },
        error: (error: unknown) => this.error.set(toAdminError(error)),
      });
  }

  private resetMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }
}
