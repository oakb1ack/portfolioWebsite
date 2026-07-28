import '@angular/compiler';

import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { toAdminError } from './admin-error';

describe('toAdminError', () => {
  it('identifies optimistic concurrency conflicts', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { detail: 'The resource changed.' },
    });

    expect(toAdminError(error)).toEqual({
      kind: 'conflict',
      message: 'The resource changed.',
    });
  });

  it('preserves server field validation messages', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        detail: 'Review the fields.',
        errors: { slug: 'Slug is already used.' },
      },
    });

    expect(toAdminError(error)).toEqual({
      kind: 'validation',
      message: 'Review the fields.',
      fields: { slug: 'Slug is already used.' },
    });
  });
});
