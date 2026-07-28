import '@angular/compiler';

import { describe, expect, it } from 'vitest';

import {
  csvToList,
  linesToProjectLinks,
  projectLinksValidator,
  toISOStringOrNull,
} from './admin-form.utils';
import { FormControl } from '@angular/forms';

describe('admin form utilities', () => {
  it('normalizes comma-separated IDs', () => {
    expect(csvToList(' one, two ,, three ')).toEqual(['one', 'two', 'three']);
  });

  it('parses project link lines into ordered API input', () => {
    expect(linesToProjectLinks('github | Source | https://example.com/repo')).toEqual([
      {
        kind: 'github',
        label: 'Source',
        url: 'https://example.com/repo',
        sort_order: 0,
      },
    ]);
  });

  it('rejects malformed project link lines', () => {
    const control = new FormControl('github | Missing URL', { nonNullable: true });
    expect(projectLinksValidator(control)).toEqual({ projectLinks: true });
  });

  it('omits an empty scheduled time', () => {
    expect(toISOStringOrNull('')).toBeNull();
  });
});
