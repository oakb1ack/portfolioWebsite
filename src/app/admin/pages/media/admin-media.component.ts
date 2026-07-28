import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AdminErrorState, toAdminError } from '../../core/admin-error';
import { AdminMedia } from '../../core/admin.models';
import { AdminStateComponent } from '../../shared/admin-state.component';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

@Component({
  selector: 'app-admin-media',
  imports: [ReactiveFormsModule, AdminStateComponent],
  templateUrl: './admin-media.component.html',
  styleUrl: './admin-media.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMediaComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly media = signal<AdminMedia[]>([]);
  readonly file = signal<File | null>(null);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly error = signal<AdminErrorState | null>(null);
  readonly notice = signal<string | null>(null);

  readonly form = this.fb.group({
    altText: ['', Validators.maxLength(500)],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listMedia().subscribe({
      next: (page) => {
        this.media.set(page.items);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toAdminError(error));
        this.loading.set(false);
      },
    });
  }

  chooseFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    this.notice.set(null);
    if (!file) {
      this.file.set(null);
      return;
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      this.file.set(null);
      input.value = '';
      this.error.set({
        kind: 'validation',
        message: 'Choose a JPEG, PNG, WebP, GIF, or PDF file.',
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      this.file.set(null);
      input.value = '';
      this.error.set({
        kind: 'validation',
        message: 'The selected file is larger than the 20 MiB upload limit.',
      });
      return;
    }
    this.error.set(null);
    this.file.set(file);
  }

  upload(): void {
    const file = this.file();
    if (!file || this.form.invalid || this.uploading()) {
      this.form.markAllAsTouched();
      if (!file) {
        this.error.set({ kind: 'validation', message: 'Choose a file to upload.' });
      }
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.api
      .uploadMedia(file, this.form.controls.altText.value.trim())
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (asset) => {
          this.media.update((items) => [asset, ...items]);
          this.file.set(null);
          this.form.reset({ altText: '' });
          this.notice.set('Media uploaded.');
        },
        error: (error: unknown) => this.error.set(toAdminError(error)),
      });
  }

  remove(asset: AdminMedia): void {
    if (
      this.deletingId() ||
      !window.confirm(`Delete “${asset.original_name}”? Existing content may reference it.`)
    ) {
      return;
    }
    this.deletingId.set(asset.id);
    this.error.set(null);
    this.notice.set(null);
    this.api
      .deleteMedia(asset.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.media.update((items) => items.filter((item) => item.id !== asset.id));
          this.notice.set('Media deleted.');
        },
        error: (error: unknown) => this.error.set(toAdminError(error)),
      });
  }

  isImage(asset: AdminMedia): boolean {
    return asset.mime_type.startsWith('image/');
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KiB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
  }
}
