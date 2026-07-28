import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import {
  combineLatest,
  catchError,
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
  ProjectsApiService,
  PublicApiError,
  PublicProject,
} from '../../../core/public-api';
import { ProjectEmptyStateComponent } from '../../components/project-empty-state/project-empty-state.component';
import { ProjectCardComponent } from '../../components/project-card/project-card.component';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-projects-list',
  imports: [RouterLink, ProjectCardComponent, ProjectEmptyStateComponent],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss',
})
export class ProjectsListComponent {
  private readonly api = inject(ProjectsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly retryRequest = new Subject<void>();

  protected readonly page = signal<PageResponse<PublicProject> | undefined>(undefined);
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
          this.isLoading.set(true);
          this.error.set(undefined);
        }),
        switchMap((query) =>
          this.api.list(query).pipe(
            tap((page) => this.page.set(page)),
            catchError((error: unknown) => {
              this.page.set(undefined);
              this.error.set(this.errorMessage(error));
              return EMPTY;
            }),
            finalize(() => this.isLoading.set(false)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected retry(): void {
    this.retryRequest.next();
  }

  protected previousOffset(page: PageResponse<PublicProject>): number {
    return Math.max(0, page.offset - page.limit);
  }

  protected nextOffset(page: PageResponse<PublicProject>): number {
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
      return 'The project archive is temporarily unavailable. Please try again shortly.';
    }

    return 'Projects could not be loaded. Check your connection and try again.';
  }
}
