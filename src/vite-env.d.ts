/// <reference types="vite/client" />

declare module 'virtual:blog-posts' {
  export const posts: import('./data/blog').BlogPost[];
  export const siteOrigin: string;
}
