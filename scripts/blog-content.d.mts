import type { BlogPost } from '../src/data/blog.ts';

export function compilePost(source: string, filename: string, options?: { includeDrafts?: boolean }): Promise<BlogPost | null>;
export function readPosts(directory: string, options?: { includeDrafts?: boolean }): Promise<BlogPost[]>;
export function escapeXml(value: unknown): string;
export function rssFeed(posts: BlogPost[], origin: string, name: string): string;
