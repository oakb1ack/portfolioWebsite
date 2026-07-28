import { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/posts-list/posts-list.component').then((module) => module.PostsListComponent),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./pages/post-detail/post-detail.component').then(
        (module) => module.PostDetailComponent,
      ),
  },
];
