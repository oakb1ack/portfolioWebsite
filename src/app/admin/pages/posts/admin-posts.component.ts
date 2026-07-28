import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { AdminErrorState, toAdminError } from '../../core/admin-error';
import { AdminPost, PostInput } from '../../core/admin.models';
import {
  csvToList,
  listToCsv,
  toDateTimeLocal,
  toISOStringOrNull,
} from '../../shared/admin-form.utils';
import { AdminStateComponent } from '../../shared/admin-state.component';

@Component({
  selector: 'app-admin-posts',
  imports: [ReactiveFormsModule, AdminStateComponent],
  templateUrl: './admin-posts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPostsComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly posts = signal<AdminPost[]>([]);
  readonly selected = signal<AdminPost | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly editorOpen = signal(false);
  readonly error = signal<AdminErrorState | null>(null);
  readonly notice = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(240)]],
    slug: [''],
    summary: ['', [Validators.required, Validators.maxLength(1000)]],
    bodyMarkdown: [''],
    status: ['draft' as PostInput['status'], Validators.required],
    publishAt: [''],
    featuredMediaId: [''],
    featured: [false],
    tagIds: [''],
    categoryIds: [''],
    readingTimeMinutes: [0, [Validators.min(0)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listPosts().subscribe({
      next: (page) => {
        this.posts.set(page.items);
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
      readingTimeMinutes: 0,
    });
    this.resetMessages();
    this.editorOpen.set(true);
  }

  edit(post: AdminPost): void {
    this.selected.set(post);
    this.form.reset({
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      bodyMarkdown: post.body_markdown,
      status: post.status,
      publishAt: toDateTimeLocal(post.publish_at),
      featuredMediaId: post.featured_media_id ?? '',
      featured: post.featured,
      tagIds: listToCsv(post.tag_ids),
      categoryIds: listToCsv(post.category_ids),
      readingTimeMinutes: post.reading_time_minutes,
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
    const input: PostInput = {
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
      reading_time_minutes: value.readingTimeMinutes,
      ...(current ? { expected_updated_at: current.updated_at } : {}),
    };

    this.saving.set(true);
    this.resetMessages();
    const request = current ? this.api.updatePost(current.id, input) : this.api.createPost(input);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.posts.update((items) => {
          const found = items.some((item) => item.id === saved.id);
          return found
            ? items.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...items];
        });
        this.selected.set(saved);
        this.notice.set(current ? 'Post changes saved.' : 'Post created.');
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
    this.api.getPost(current.id).subscribe({
      next: (post) => this.edit(post),
      error: (error: unknown) => this.error.set(toAdminError(error)),
    });
  }

  remove(post: AdminPost): void {
    if (this.deleting() || !window.confirm(`Delete “${post.title}”? This cannot be undone.`)) {
      return;
    }
    this.deleting.set(true);
    this.resetMessages();
    this.api
      .deletePost(post.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.posts.update((items) => items.filter((item) => item.id !== post.id));
          if (this.selected()?.id === post.id) {
            this.cancel();
          }
          this.notice.set('Post deleted.');
        },
        error: (error: unknown) => this.error.set(toAdminError(error)),
      });
  }

  private resetMessages(): void {
    this.error.set(null);
    this.notice.set(null);
  }
}
