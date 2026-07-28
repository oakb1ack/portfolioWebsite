import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AdminErrorState, toAdminError } from '../../core/admin-error';
import { TaxonomyKind, TaxonomyTerm } from '../../core/admin.models';
import { AdminStateComponent } from '../../shared/admin-state.component';

@Component({
  selector: 'app-admin-taxonomy',
  imports: [ReactiveFormsModule, AdminStateComponent],
  templateUrl: './admin-taxonomy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTaxonomyComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly kind = signal<TaxonomyKind>('tag');
  readonly terms = signal<TaxonomyTerm[]>([]);
  readonly selected = signal<TaxonomyTerm | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly editorOpen = signal(false);
  readonly error = signal<AdminErrorState | null>(null);
  readonly notice = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', Validators.required],
    description: [''],
  });

  constructor() {
    this.load();
  }

  selectKind(kind: TaxonomyKind): void {
    if (this.kind() === kind) {
      return;
    }
    this.kind.set(kind);
    this.close();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listTaxonomy(this.kind()).subscribe({
      next: (terms) => {
        this.terms.set(terms);
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
    this.form.reset({ name: '', slug: '', description: '' });
    this.resetMessages();
    this.editorOpen.set(true);
  }

  edit(term: TaxonomyTerm): void {
    this.selected.set(term);
    this.form.reset({ name: term.name, slug: term.slug, description: term.description });
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
    const input = {
      name: value.name.trim(),
      slug: value.slug.trim(),
      description: value.description.trim(),
      ...(current ? { expected_updated_at: current.updated_at } : {}),
    };
    this.saving.set(true);
    this.resetMessages();
    const request = current
      ? this.api.updateTaxonomy(this.kind(), current.id, input)
      : this.api.createTaxonomy(this.kind(), input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.terms.update((items) => {
          const exists = items.some((item) => item.id === saved.id);
          return exists
            ? items.map((item) => (item.id === saved.id ? saved : item))
            : [...items, saved];
        });
        this.selected.set(saved);
        this.notice.set(current ? 'Taxonomy term saved.' : 'Taxonomy term created.');
      },
      error: (error: unknown) => this.error.set(toAdminError(error)),
    });
  }

  remove(term: TaxonomyTerm): void {
    if (this.deletingId() || !window.confirm(`Delete “${term.name}”?`)) {
      return;
    }
    this.deletingId.set(term.id);
    this.resetMessages();
    this.api
      .deleteTaxonomy(this.kind(), term.id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.terms.update((items) => items.filter((item) => item.id !== term.id));
          if (this.selected()?.id === term.id) {
            this.close();
          }
          this.notice.set('Taxonomy term deleted.');
        },
        error: (error: unknown) => this.error.set(toAdminError(error)),
      });
  }

  private resetMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }
}
