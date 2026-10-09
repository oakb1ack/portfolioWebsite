import { useEffect, useState } from 'react';
import type { MouseEvent, RefObject } from 'react';
import { blogDate, blogPath } from '../data/blog.ts';
import type { BlogHeading, BlogPost } from '../data/blog.ts';
import { site } from '../data/site.ts';

interface BlogPageProps {
  posts: BlogPost[];
  slug?: string;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}

function NotebookMark() {
  return <svg className="blog-notebook-mark" viewBox="0 0 96 112" fill="none" aria-hidden="true">
    <path d="M18 10H72L82 20V101H18L10 93V18Z" fill="#111b16" stroke="currentColor" strokeWidth="2" />
    <path d="M26 10V101M34 29H65M34 78H65M34 85H56M18 16H72L76 20V95H26" stroke="currentColor" strokeWidth="1" />
    <path d="M49 38L65 54L49 70L33 54Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M49 46L57 54L49 62L41 54Z" fill="#ab3f2a" />
    <path d="M61 10V32L66 28L71 32V10" fill="#ab3f2a" stroke="#080e0a" strokeWidth="1.5" />
  </svg>;
}

function PostMeta({ post }: { post: BlogPost }) {
  return <p className="blog-meta">
    <time dateTime={post.date}>{blogDate(post.date)}</time>
    <span className="blog-meta-dot" aria-hidden="true">·</span>
    <span>{post.readingMinutes} min read</span>
    {post.draft && <span className="blog-draft">Draft preview</span>}
  </p>;
}

function Topics({ tags }: { tags: string[] }) {
  return tags.length ? <ul className="blog-tags" aria-label="Article topics">{tags.map(tag => <li key={tag}>{tag}</li>)}</ul> : null;
}

function Contents({ headings, active }: { headings: BlogHeading[]; active: string }) {
  return <nav aria-label="On this page"><ol className="blog-contents">
    {headings.map((heading, index) => <li key={heading.id} className={heading.level === 3 ? 'blog-subsection' : undefined}>
      <a href={`#${heading.id}`} aria-current={active === heading.id ? 'location' : undefined}>
        <span className="blog-section-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span>{heading.title}</span>
      </a>
    </li>)}
  </ol></nav>;
}

function BlogArticle({ post, onNavigate }: { post: BlogPost; onNavigate: BlogPageProps['onNavigate'] }) {
  const [active, setActive] = useState(post.headings[0]?.id ?? '');
  const [copyStatus, setCopyStatus] = useState('');
  const hasContents = post.headings.length > 1;
  const descriptionHtml = `<p>${post.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;

  useEffect(() => {
    if (window.location.hash) {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (post.headings.some(heading => heading.id === id)) document.getElementById(id)?.scrollIntoView();
    }
    if (!hasContents) return;
    const sections = post.headings.map(heading => document.getElementById(heading.id)).filter((element): element is HTMLElement => element !== null);
    let frame = 0;
    const updateActive = () => {
      frame = 0;
      let current = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top > 96) break;
        current = section;
      }
      if (current) setActive(current.id);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActive);
    };
    updateActive();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [post, hasContents]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${blogPath(post.slug)}`);
      setCopyStatus('Link copied.');
    } catch {
      setCopyStatus('Copy the address from your browser to share this note.');
    }
  }

  return <>
    <div className="blog-article-tools">
      <span className="blog-byline"><span className="blog-author-mark" aria-hidden="true">A</span> A note by <strong>{site.name}</strong></span>
      {onNavigate && <button className="blog-copy-link" onClick={copyLink}>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M8 6H5a4 4 0 0 0 0 8h3M12 6h3a4 4 0 0 1 0 8h-3M6 10h8" stroke="currentColor" strokeWidth="1.5" /></svg>
        {copyStatus === 'Link copied.' ? 'Link copied' : 'Copy link'}
      </button>}
      <span className="blog-copy-status" role="status">{copyStatus}</span>
    </div>
    {hasContents && <details className="blog-mobile-contents">
      <summary>In this note <span>{post.headings.length} sections <span aria-hidden="true">⌄</span></span></summary>
      <Contents headings={post.headings} active={active} />
    </details>}
    <div className={`blog-reader${hasContents ? ' blog-reader-with-contents' : ''}`}>
      <article className="blog-paper" aria-labelledby="blog-heading">
        {post.html.trim() !== descriptionHtml && <p className="blog-deck">{post.description}</p>}
        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.html }} />
        <div className="blog-paper-end" aria-hidden="true">◆</div>
      </article>
      {hasContents && <aside className="blog-outline" aria-label="Article sections">
        <p className="blog-outline-label">In this note</p>
        <Contents headings={post.headings} active={active} />
        <a className="blog-outline-top" href="#blog-heading">Back to top <span aria-hidden="true">↑</span></a>
      </aside>}
    </div>
    <nav className="blog-endnote" aria-label="Continue reading">
      <a href="/blog" onClick={event => onNavigate?.(event, '/blog')}><span aria-hidden="true">←</span> All notes</a>
      <a href="#blog-heading">Back to top <span aria-hidden="true">↑</span></a>
    </nav>
  </>;
}

export function BlogPage({ posts, slug, headingRef, onNavigate }: BlogPageProps) {
  const post = slug ? posts.find(item => item.slug === slug) : undefined;
  const missing = slug !== undefined && !post;
  const returnPath = slug ? '/blog' : '/';
  const latestPublished = posts.find(item => !item.draft)?.slug;

  return (
    <main className={`blog-page page-enter${post ? ' blog-article-page' : ' blog-index-page'}`} aria-labelledby="blog-heading">
      <nav className="blog-navigation" aria-label="Blog navigation">
        <a className="back-button" href={returnPath} onClick={event => onNavigate?.(event, returnPath)}>
          <span aria-hidden="true">←</span> {slug ? 'Back to the notebook' : 'Return to the house'}
        </a>
      </nav>
      <div className="blog-content">
        <header className="blog-heading">
          <div className="blog-heading-text">
            {slug && <p className="eyebrow">03 / The notebook</p>}
            <h1 id="blog-heading" ref={headingRef} tabIndex={-1}>
              {missing ? 'A missing page.' : post ? post.title : 'Blog'}
            </h1>
            {post ? <><PostMeta post={post} /><Topics tags={post.tags} /></> : missing ? <p className="blog-intro">This article may have moved, or the link may be incomplete.</p> : null}
          </div>
          {!slug && <div className="blog-index-emblem"><div className="blog-notebook-seal"><NotebookMark /></div></div>}
        </header>
        <div className="blog-rule" aria-hidden="true"><span>◆</span></div>
        {missing ? <div className="blog-empty"><p>The rest of the notebook is still here.</p><a href="/blog" onClick={event => onNavigate?.(event, '/blog')}>Browse all notes <span aria-hidden="true">→</span></a></div> : post ? <BlogArticle key={post.slug} post={post} onNavigate={onNavigate} /> : <>
          {posts.length ? <ol className="blog-list">{posts.map((item, index) => (
            <li key={item.slug}>
              <article className={`blog-entry${item.slug === latestPublished ? ' blog-entry-latest' : ''}`}>
                <a className="blog-entry-link" href={blogPath(item.slug)} aria-labelledby={`blog-title-${item.slug}`} onClick={event => onNavigate?.(event, blogPath(item.slug))}>
                  <div className="blog-entry-number" aria-hidden="true"><small>Note</small><span>{String(posts.length - index).padStart(2, '0')}</span><i>◆</i></div>
                  <div className="blog-entry-body">
                    <div className="blog-entry-topline"><PostMeta post={item} />{item.slug === latestPublished && <span className="blog-latest-label">Latest note</span>}</div>
                    <h2 id={`blog-title-${item.slug}`}>{item.title}</h2>
                    <p className="blog-entry-description">{item.description}</p>
                    <div className="blog-entry-bottom"><Topics tags={item.tags} /><span className="blog-read-note">Read note <span aria-hidden="true">→</span></span></div>
                  </div>
                </a>
              </article>
            </li>
          ))}</ol> : <div className="blog-empty"><p>The notebook is waiting for its first entry.</p><span>New notes will appear here.</span></div>}
        </>}
      </div>
    </main>
  );
}
