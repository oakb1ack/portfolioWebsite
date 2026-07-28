import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AdminErrorState, toAdminError } from '../../core/admin-error';
import { AdminProfile } from '../../core/admin.models';
import { AdminStateComponent } from '../../shared/admin-state.component';

@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule, AdminStateComponent],
  template: `
    <section class="admin-page">
      <header class="admin-page__header">
        <div>
          <h1>Profile</h1>
          <p>Maintain the biography and résumé details used across the public portfolio.</p>
        </div>
      </header>

      @if (loading()) {
        <app-admin-state message="Loading profile…" />
      } @else {
        @if (notice()) {
          <app-admin-state [message]="notice()!" tone="success" />
        }
        @if (error(); as requestError) {
          <app-admin-state
            [message]="requestError.message"
            tone="error"
            [retryable]="requestError.kind === 'conflict'"
            (retry)="load()"
          />
        }
        @if (ready()) {
          <form class="admin-card admin-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
            <div class="admin-fields">
              <label class="admin-field admin-field--half">
                <span>Name</span>
                <input
                  formControlName="name"
                  [attr.aria-invalid]="form.controls.name.invalid && form.controls.name.touched"
                />
                @if (form.controls.name.invalid && form.controls.name.touched) {
                  <small class="admin-error-text"
                    >A name of 160 characters or fewer is required.</small
                  >
                }
              </label>
              <label class="admin-field admin-field--half">
                <span>Headline</span><input formControlName="headline" />
              </label>
              <label class="admin-field admin-field--half">
                <span>Education</span><input formControlName="education" />
              </label>
              <label class="admin-field admin-field--half">
                <span>Current role</span><input formControlName="currentRole" />
              </label>
              <label class="admin-field">
                <span>Statement</span>
                <textarea rows="4" formControlName="statement"></textarea>
                <small>Up to 500 characters.</small>
              </label>
              <label class="admin-field">
                <span>Biography (Markdown)</span>
                <textarea rows="15" formControlName="bioMarkdown"></textarea>
              </label>
              <label class="admin-field admin-field--half">
                <span>Résumé media ID</span>
                <input formControlName="resumeMediaId" />
                <small>Upload a PDF in the media library, then use its ID here.</small>
              </label>
            </div>
            <div class="admin-actions">
              <button type="submit" class="admin-button" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Save profile' }}
              </button>
            </div>
          </form>
        }
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfileComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly profile = signal<AdminProfile | null>(null);
  readonly ready = signal(false);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<AdminErrorState | null>(null);
  readonly notice = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    headline: ['', Validators.maxLength(240)],
    education: ['', Validators.maxLength(240)],
    currentRole: ['', Validators.maxLength(240)],
    statement: ['', Validators.maxLength(500)],
    bioMarkdown: [''],
    resumeMediaId: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.ready.set(false);
    this.error.set(null);
    this.notice.set(null);
    this.api.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.ready.set(true);
        this.form.reset({
          name: profile.name,
          headline: profile.headline,
          education: profile.education,
          currentRole: profile.current_role,
          statement: profile.statement,
          bioMarkdown: profile.bio_markdown,
          resumeMediaId: profile.resume_media_id ?? '',
        });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.profile.set(null);
          this.form.reset({
            name: '',
            headline: '',
            education: '',
            currentRole: '',
            statement: '',
            bioMarkdown: '',
            resumeMediaId: '',
          });
          this.ready.set(true);
          this.loading.set(false);
          return;
        }
        this.error.set(toAdminError(error));
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const current = this.profile();
    if (!this.ready() || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.api
      .updateProfile({
        name: value.name.trim(),
        headline: value.headline.trim(),
        education: value.education.trim(),
        current_role: value.currentRole.trim(),
        statement: value.statement.trim(),
        bio_markdown: value.bioMarkdown,
        resume_media_id: value.resumeMediaId.trim() || null,
        ...(current ? { expected_updated_at: current.updated_at } : {}),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.notice.set('Profile changes saved.');
        },
        error: (error: unknown) => this.error.set(toAdminError(error)),
      });
  }
}
