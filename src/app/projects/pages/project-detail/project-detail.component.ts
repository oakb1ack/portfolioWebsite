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
  ProjectsApiService,
  PublicApiError,
  PublicProject,
} from '../../../core/public-api';
import { ProjectMetaComponent } from '../../components/project-meta/project-meta.component';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, ProjectMetaComponent],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent {
  private readonly api = inject(ProjectsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly retryRequest = new Subject<void>();

  protected readonly project = signal<PublicProject | undefined>(undefined);
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
          this.project.set(undefined);

          return this.api.get(slug).pipe(
            tap((project) => this.project.set(project)),
            catchError((error: unknown) => {
              this.isNotFound.set(error instanceof PublicApiError && error.status === 404);
              this.error.set(
                'This case study could not be loaded. Check your connection and try again.',
              );
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
