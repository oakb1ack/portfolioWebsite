export interface BlogHeading {
  id: string;
  title: string;
  level: 2 | 3;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
  html: string;
  headings: BlogHeading[];
}

export function blogPath(slug?: string) {
  return slug ? `/blog/${slug}` : '/blog';
}

export function blogDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
