import { HttpErrorResponse } from '@angular/common/http';

import { ApiProblem } from './admin.models';

export interface AdminErrorState {
  kind: 'auth' | 'conflict' | 'validation' | 'server' | 'network';
  message: string;
  fields?: Record<string, string>;
}

export function toAdminError(error: unknown): AdminErrorState {
  if (!(error instanceof HttpErrorResponse)) {
    return { kind: 'network', message: 'The request could not be completed. Please try again.' };
  }

  const problem = (error.error ?? {}) as ApiProblem;
  const message = problem.detail || problem.title;

  if (error.status === 401 || error.status === 403) {
    return {
      kind: 'auth',
      message:
        error.status === 401
          ? 'Your session has expired. Sign in again to continue.'
          : message || 'This action could not be verified. Refresh and try again.',
    };
  }
  if (error.status === 409) {
    return {
      kind: 'conflict',
      message: message || 'This item changed after you opened it. Reload it before saving again.',
    };
  }
  if (error.status === 400 || error.status === 422) {
    return {
      kind: 'validation',
      message: message || 'Review the highlighted information and try again.',
      fields: problem.errors,
    };
  }
  if (error.status >= 500) {
    return { kind: 'server', message: message || 'The server could not complete the request.' };
  }
  return {
    kind: 'network',
    message: message || 'The server could not be reached. Check your connection and try again.',
  };
}
