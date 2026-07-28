import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AdminErrorState, toAdminError } from '../../core/admin-error';
import { AdminProject, ProjectInput } from '../../core/admin.models';
import {
  csvToList,
  linesToProjectLinks,
  listToCsv,
  projectLinksToLines,
  projectLinksValidator,
  toDateTimeLocal,
  toISOStringOrNull,
} from '../../shared/admin-form.utils';
import { AdminStateComponent } from '../../shared/admin-state.component';

@Component({
  selector: 'app-admin-projects',
  imports: [ReactiveFormsModule, AdminStateComponent],
  templateUrl: './admin-projects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProjectsComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly projects = signal<AdminProject[]>([]);
  readonly selected = signal<AdminProject | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly error = signal<AdminErrorState | null>(null);
  readonly notice = signal<string | null>(null);
  readonly editorOpen = signal(false);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(240)]],
    slug: [''],
    summary: ['', [Validators.required, Validators.maxLength(500)]],
    bodyMarkdown: [''],
    status: ['draft' as ProjectInput['status'], Validators.required],
    publishAt: [''],
    featuredMediaId: [''],
    featured: [false],
    tagIds: [''],
    categoryIds: [''],
    outcome: ['', [Validators.required, Validators.maxLength(1000)]],
    role: [''],
    technologies: [''],
    stage: ['current' as ProjectInput['stage'], Validators.required],
    availability: ['public' as ProjectInput['availability'], Validators.required],
    links: ['', projectLinksValidator],
    sortOrder: [0],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listProjects().subscribe({
      next: (page) => {
        this.projects.set(page.items);
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
      title: '',
      slug: '',
      summary: '',
      bodyMarkdown: '',
      status: 'draft',
      publishAt: '',
      featuredMediaId: '',
      featured: false,
      tagIds: '',
      categoryIds: '',
      outcome: '',
      role: '',
      technologies: '',
      stage: 'current',
      availability: 'public',
      links: '',
      sortOrder: 0,
    });
    this.resetMessages();
    this.editorOpen.set(true);
  }

  edit(project: AdminProject): void {
    this.selected.set(project);
    this.form.reset({
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      bodyMarkdown: project.body_markdown,
      status: project.status,
      publishAt: toDateTimeLocal(project.publish_at),
      featuredMediaId: project.featured_media_id ?? '',
      featured: project.featured,
      tagIds: listToCsv(project.tag_ids),
      categoryIds: listToCsv(project.category_ids),
      outcome: project.outcome,
      role: project.role,
      technologies: listToCsv(project.technologies),
      stage: project.stage,
      availability: project.availability,
      links: projectLinksToLines(project.links),
      sortOrder: project.sort_order,
    });
    this.resetMessages();
    this.editorOpen.set(true);
  }

  cancel(): void {
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
    const input: ProjectInput = {
      title: value.title.trim(),
      slug: value.slug.trim(),
      summary: value.summary.trim(),
      body_markdown: value.bodyMarkdown,
      status: value.status,
      publish_at: toISOStringOrNull(value.publishAt),
      featured_media_id: value.featuredMediaId.trim() || null,
      featured: value.featured,
      tag_ids: csvToList(value.tagIds),
      category_ids: csvToList(value.categoryIds),
      outcome: value.outcome.trim(),
      role: value.role.trim(),
      technologies: csvToList(value.technologies),
      stage: value.stage,
      availability: value.availability,
      links: linesToProjectLinks(value.links),
      sort_order: value.sortOrder,
      ...(current ? { expected_updated_at: current.updated_at } : {}),
    };

    this.saving.set(true);
    this.resetMessages();
    const request = current
      ? this.api.updateProject(current.id, input)
      : this.api.createProject(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.projects.update((items) => {
          const index = items.findIndex((item) => item.id === saved.id);
          return index < 0
            ? [saved, ...items]
            : items.map((item) => (item.id === saved.id ? saved : item));
        });
        this.selected.set(saved);
        this.notice.set(current ? 'Project changes saved.' : 'Project created.');
      },
      error: (error: unknown) => this.error.set(toAdminError(error)),
    });
  }

  reloadSelected(): void {
    const current = this.selected();
    if (!current) {
      this.load();
      return;
    }
    this.api.getProject(current.id).subscribe({
      next: (project) => this.edit(project),
      error: (error: unknown) => this.error.set(toAdminError(error)),
    });
  }

  remove(project: AdminProject): void {
    if (
      this.deleting() ||
      !window.confirm(`Delete “${project.title}”? This action cannot be undone.`)
    ) {
      return;
    }
    this.deleting.set(true);
    this.resetMessages();
    this.api
      .deleteProject(project.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.projects.update((items) => items.filter((item) => item.id !== project.id));
          if (this.selected()?.id === project.id) {
            this.cancel();
          }
          this.notice.set('Project deleted.');
        },
        error: (error: unknown) => this.error.set(toAdminError(error)),
      });
  }

  private resetMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }
}
