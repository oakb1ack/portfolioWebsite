import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, startWith, Subject, switchMap, tap } from 'rxjs';
import { ProfileApiService, PublicApiError, PublicProfile } from '../core/public-api';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly api = inject(ProfileApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retryRequest = new Subject<void>();

  protected readonly profile = signal<PublicProfile | undefined>(undefined);
  protected readonly error = signal<string | undefined>(undefined);
  protected readonly isLoading = signal(true);

  constructor() {
    this.retryRequest
      .pipe(
        startWith(undefined),
        tap(() => {
          this.isLoading.set(true);
          this.error.set(undefined);
        }),
        switchMap(() =>
          this.api.get().pipe(
            tap((profile) => this.profile.set(profile)),
            catchError((error: unknown) => {
              this.profile.set(undefined);
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

  private errorMessage(error: unknown): string {
    if (error instanceof PublicApiError && error.status === 404) {
      return 'The public profile has not been published yet.';
    }

    return 'The profile could not be loaded. Check your connection and try again.';
  }
}
