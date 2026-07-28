import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiProblem } from './public-api.models';

export class PublicApiError extends Error {
  readonly problem?: ApiProblem;
  readonly status: number;

  constructor(error: HttpErrorResponse) {
    const problem = isApiProblem(error.error) ? error.error : undefined;
    super(problem?.detail || problem?.title || error.message || 'The request failed.');

    this.name = 'PublicApiError';
    this.problem = problem;
    this.status = problem?.status ?? error.status;
  }
}

export function rethrowPublicApiError(error: unknown): Observable<never> {
  if (error instanceof PublicApiError) {
    return throwError(() => error);
  }

  if (error instanceof HttpErrorResponse) {
    return throwError(() => new PublicApiError(error));
  }

  return throwError(() => error);
}

function isApiProblem(value: unknown): value is ApiProblem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const problem = value as Partial<ApiProblem>;
  return (
    typeof problem.type === 'string' &&
    typeof problem.title === 'string' &&
    typeof problem.status === 'number'
  );
}
