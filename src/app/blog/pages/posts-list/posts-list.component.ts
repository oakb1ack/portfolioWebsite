import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  EMPTY,
  finalize,
  map,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import {
  ContentListQuery,
  PageResponse,
  PostsApiService,
  PublicApiError,
  PublicPost,
} from '../../../core/public-api';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-posts-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './posts-list.component.html',
  styleUrl: './posts-list.component.scss',
})
export class PostsListComponent {
  private readonly api = inject(PostsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly retryRequest = new Subject<void>();

  protected readonly page = signal<PageResponse<PublicPost> | undefined>(undefined);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly isLoading = signal(true);
  protected readonly activeTag = signal<string | undefined>(undefined);
  protected readonly activeCategory = signal<string | undefined>(undefined);

  constructor() {
    combineLatest([this.route.queryParamMap, this.retryRequest.pipe(startWith(undefined))])
      .pipe(
        map(([params]) => this.queryFrom(params)),
        tap((query) => {
          this.activeTag.set(query.tag);
          this.activeCategory.set(query.category);
        }),
        switchMap((query) => {
          this.isLoading.set(true);
          this.error.set(undefined);

          return this.api.list(query).pipe(
            tap((page) => this.page.set(page)),
            catchError((error: unknown) => {
              this.page.set(undefined);
              this.error.set(this.errorMessage(error));
              return EMPTY;
            }),
            finalize(() => this.isLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected retry(): void {
    this.retryRequest.next();
  }

  protected previousOffset(page: PageResponse<PublicPost>): number {
    return Math.max(0, page.offset - page.limit);
  }

  protected nextOffset(page: PageResponse<PublicPost>): number {
    return page.offset + page.limit;
  }

  private queryFrom(params: ParamMap): ContentListQuery {
    const rawOffset = Number(params.get('offset'));
    return {
      limit: PAGE_SIZE,
      offset: Number.isInteger(rawOffset) && rawOffset > 0 ? rawOffset : 0,
      tag: params.get('tag') || undefined,
      category: params.get('category') || undefined,
    };
  }

  private errorMessage(error: unknown): string {
    if (error instanceof PublicApiError && error.status === 503) {
      return 'The journal is temporarily unavailable. Please try again shortly.';
    }

    return 'Posts could not be loaded. Check your connection and try again.';
  }
}
