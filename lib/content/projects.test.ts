import { describe, expect, it } from 'vitest';

import {
  getAllProjects,
  getFeaturedProjects,
  getProjectBySlug,
  getProjectSlugs,
} from './projects';

describe('project content', () => {
  it('loads and validates every case study', () => {
    expect(getProjectSlugs().sort()).toEqual(['faultscope', 'fluurish', 'home-lab']);
    expect(getAllProjects()).toHaveLength(3);
  });

  it('keeps featured projects in their editorial order', () => {
    expect(getFeaturedProjects().map((project) => project.slug)).toEqual([
      'faultscope',
      'fluurish',
      'home-lab',
    ]);
  });

  it('finds a project by slug', () => {
    expect(getProjectBySlug('faultscope')?.outcome).toContain('31,973');
    expect(getProjectBySlug('missing-project')).toBeUndefined();
  });
});
