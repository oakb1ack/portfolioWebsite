import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  MediaUrlService,
  PostsApiService,
  PublicApiError,
  PublicPost,
} from '../../../core/public-api';

@Component({
  selector: 'app-post-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent {
  private readonly api = inject(PostsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly retryRequest = new Subject<void>();

  protected readonly post = signal<PublicPost | undefined>(undefined);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly isLoading = signal(true);
  protected readonly isNotFound = signal(false);

  constructor(protected readonly mediaUrls: MediaUrlService) {
    combineLatest([
      this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
      this.retryRequest.pipe(startWith(undefined)),
    ])
      .pipe(
        switchMap(([slug]) => {
          this.isLoading.set(true);
          this.error.set(undefined);
          this.isNotFound.set(false);
          this.post.set(undefined);

          return this.api.get(slug).pipe(
            tap((post) => this.post.set(post)),
            catchError((error: unknown) => {
              this.isNotFound.set(error instanceof PublicApiError && error.status === 404);
              this.error.set('This post could not be loaded. Check your connection and try again.');
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
}
