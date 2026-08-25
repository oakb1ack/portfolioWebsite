interface ParsedFrontmatter {
  data: unknown;
  body: string;
}

const delimiter = '---';

/**
 * Parse JSON-formatted YAML frontmatter without adding a runtime dependency.
 * JSON is a valid subset of YAML, so the files remain compatible with common
 * MDX tooling while validation stays deterministic.
 */
export function parseFrontmatter(
  source: string,
  sourceName: string,
): ParsedFrontmatter {
  const normalized = source.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  const lines = normalized.split('\n');

  if (lines[0]?.trim() !== delimiter) {
    throw new Error(`${sourceName}: expected frontmatter to start with ---`);
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === delimiter,
  );

  if (closingIndex === -1) {
    throw new Error(`${sourceName}: frontmatter is missing its closing ---`);
  }

  const rawFrontmatter = lines.slice(1, closingIndex).join('\n').trim();
  if (!rawFrontmatter) {
    throw new Error(`${sourceName}: frontmatter cannot be empty`);
  }

  let data: unknown;
  try {
    data = JSON.parse(rawFrontmatter);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'invalid JSON';
    throw new Error(`${sourceName}: invalid frontmatter (${detail})`);
  }

  const body = lines
    .slice(closingIndex + 1)
    .join('\n')
    .trim();
  if (!body) {
    throw new Error(`${sourceName}: case study body cannot be empty`);
  }

  return { data, body };
}
