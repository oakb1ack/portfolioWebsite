export function normalizedPath(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

export function pageFor(pathname: string) {
  const path = normalizedPath(pathname);
  if (path === '/') return 'home';
  if (path === '/about') return 'about';
  if (path === '/experience') return 'experience';
  if (path === '/blog' || path.startsWith('/blog/')) return 'blog';
  return 'not-found';
}

export function legacyRedirect(pathname: string) {
  const path = normalizedPath(pathname);
  if (path === '/resume') return '/resume.pdf';
  if (path === '/contact') return '/about';
}
