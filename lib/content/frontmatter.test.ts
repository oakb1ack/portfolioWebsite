import { describe, expect, it } from 'vitest';

import { parseFrontmatter } from './frontmatter';

describe('parseFrontmatter', () => {
  it('parses JSON frontmatter and an MDX body', () => {
    const source = ['---', '{"title":"Example"}', '---', '', '## A case study'].join(
      '\r\n',
    );

    expect(parseFrontmatter(source, 'example.mdx')).toEqual({
      data: { title: 'Example' },
      body: '## A case study',
    });
  });

  it('reports a missing closing delimiter', () => {
    expect(() => parseFrontmatter('---\n{"title":"Example"}', 'example.mdx')).toThrow(
      'frontmatter is missing its closing ---',
    );
  });

  it('reports an empty case study', () => {
    expect(() =>
      parseFrontmatter('---\n{"title":"Example"}\n---', 'example.mdx'),
    ).toThrow('case study body cannot be empty');
  });
});
