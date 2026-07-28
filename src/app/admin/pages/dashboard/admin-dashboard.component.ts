import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { toAdminError } from '../../core/admin-error';
import { AdminStateComponent } from '../../shared/admin-state.component';

interface DashboardStats {
  projects: number;
  posts: number;
  media: number;
  links: number;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, AdminStateComponent],
  template: `
    <section class="admin-page">
      <header class="admin-page__header">
        <div>
          <h1>Overview</h1>
          <p>A quick view of the content currently available in your studio.</p>
        </div>
      </header>

      @if (loading()) {
        <app-admin-state message="Loading dashboard…" />
      } @else if (error()) {
        <app-admin-state [message]="error()!" tone="error" [retryable]="true" (retry)="load()" />
      } @else if (stats(); as summary) {
        <div class="admin-grid admin-grid--stats">
          <a class="admin-card admin-stat" routerLink="/admin/projects">
            <strong>{{ summary.projects }}</strong
            ><span>Projects</span>
          </a>
          <a class="admin-card admin-stat" routerLink="/admin/posts">
            <strong>{{ summary.posts }}</strong
            ><span>Posts</span>
          </a>
          <a class="admin-card admin-stat" routerLink="/admin/media">
            <strong>{{ summary.media }}</strong
            ><span>Media assets</span>
          </a>
          <a class="admin-card admin-stat" routerLink="/admin/contact-links">
            <strong>{{ summary.links }}</strong
            ><span>Contact links</span>
          </a>
        </div>
        <div class="admin-card dashboard-start">
          <div>
            <p class="dashboard-eyebrow">Quick start</p>
            <h2>Keep your portfolio current</h2>
            <p>Update work, publish a post, or refresh your profile details.</p>
          </div>
          <div class="admin-actions">
            <a class="admin-button" routerLink="/admin/projects">Manage projects</a>
            <a class="admin-button admin-button--quiet" routerLink="/admin/profile">Edit profile</a>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    a.admin-stat {
      color: inherit;
      text-decoration: none;
      transition:
        transform 150ms ease,
        box-shadow 150ms ease;
    }
    a.admin-stat:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.7rem 1.8rem rgb(30 55 68 / 10%);
    }
    .dashboard-start {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
    }
    .dashboard-start h2,
    .dashboard-start p {
      margin: 0;
    }
    .dashboard-start h2 {
      margin-bottom: 0.35rem;
    }
    .dashboard-start p:last-child {
      color: var(--admin-muted);
    }
    .dashboard-eyebrow {
      margin-bottom: 0.5rem !important;
      color: var(--admin-accent) !important;
      font-size: 0.75rem;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private readonly api = inject(AdminApiService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<DashboardStats | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      projects: this.api.listProjects(1),
      posts: this.api.listPosts(1),
      media: this.api.listMedia(1),
      links: this.api.listContactLinks(),
    }).subscribe({
      next: ({ projects, posts, media, links }) => {
        this.stats.set({
          projects: projects.total,
          posts: posts.total,
          media: media.total,
          links: links.length,
        });
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toAdminError(error).message);
        this.loading.set(false);
      },
    });
  }
}
