import type { MouseEventHandler, RefObject } from 'react';

export function NotFoundPage({ headingRef, onReturn }: {
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onReturn?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <main className="blog-page page-enter" aria-labelledby="page-not-found">
      <nav className="blog-navigation" aria-label="Page navigation">
        <a className="back-button" href="/" onClick={onReturn}>
          <span aria-hidden="true">←</span> Return to the house
        </a>
      </nav>
      <div className="blog-content">
        <header className="blog-heading">
          <div className="blog-heading-text">
            <p className="eyebrow">404 / Page not found</p>
            <h1 id="page-not-found" ref={headingRef} tabIndex={-1}>A missing page.</h1>
            <p className="blog-intro">This page may have moved, or the address may be incomplete.</p>
          </div>
        </header>
      </div>
    </main>
  );
}
