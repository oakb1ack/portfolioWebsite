import { AbstractControl, ValidationErrors } from '@angular/forms';

import { ProjectLink } from '../core/admin.models';

export function csvToList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function listToCsv(values?: string[] | null): string {
  return (values ?? []).join(', ');
}

export function toDateTimeLocal(value?: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function toISOStringOrNull(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function linesToProjectLinks(value: string): ProjectLink[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [kind, label, url] = line.split('|').map((part) => part.trim());
      return {
        kind: (kind || 'other') as ProjectLink['kind'],
        label: label ?? '',
        url: url ?? '',
        sort_order: index,
      };
    });
}

export function projectLinksToLines(links?: ProjectLink[] | null): string {
  return (links ?? []).map((link) => `${link.kind} | ${link.label} | ${link.url}`).join('\n');
}

export function projectLinksValidator(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value.trim()) {
    return null;
  }
  const validKinds = new Set(['github', 'live_demo', 'related_blog', 'paper', 'other']);
  const invalid = control.value.split('\n').some((line) => {
    const [kind, label, url] = line.split('|').map((part) => part.trim());
    if (!validKinds.has(kind) || !label || !url) {
      return true;
    }
    try {
      const parsed = new URL(url);
      return parsed.protocol !== 'http:' && parsed.protocol !== 'https:';
    } catch {
      return true;
    }
  });
  return invalid ? { projectLinks: true } : null;
}
