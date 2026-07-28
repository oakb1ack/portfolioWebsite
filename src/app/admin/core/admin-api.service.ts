import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AdminMedia,
  AdminPost,
  AdminProfile,
  AdminProject,
  ContactLink,
  ContactLinkInput,
  PageResult,
  PostInput,
  ProfileInput,
  ProjectInput,
  TaxonomyInput,
  TaxonomyKind,
  TaxonomyTerm,
} from './admin.models';

const ADMIN_URL = '/api/v1/admin';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  listProjects(limit = 100, offset = 0): Observable<PageResult<AdminProject>> {
    return this.http.get<PageResult<AdminProject>>(`${ADMIN_URL}/projects`, {
      params: this.pageParams(limit, offset),
    });
  }

  getProject(id: string): Observable<AdminProject> {
    return this.http.get<AdminProject>(`${ADMIN_URL}/projects/${encodeURIComponent(id)}`);
  }

  createProject(input: ProjectInput): Observable<AdminProject> {
    return this.http.post<AdminProject>(`${ADMIN_URL}/projects`, input);
  }

  updateProject(id: string, input: ProjectInput): Observable<AdminProject> {
    return this.http.put<AdminProject>(`${ADMIN_URL}/projects/${encodeURIComponent(id)}`, input);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${ADMIN_URL}/projects/${encodeURIComponent(id)}`);
  }

  listPosts(limit = 100, offset = 0): Observable<PageResult<AdminPost>> {
    return this.http.get<PageResult<AdminPost>>(`${ADMIN_URL}/posts`, {
      params: this.pageParams(limit, offset),
    });
  }

  getPost(id: string): Observable<AdminPost> {
    return this.http.get<AdminPost>(`${ADMIN_URL}/posts/${encodeURIComponent(id)}`);
  }

  createPost(input: PostInput): Observable<AdminPost> {
    return this.http.post<AdminPost>(`${ADMIN_URL}/posts`, input);
  }

  updatePost(id: string, input: PostInput): Observable<AdminPost> {
    return this.http.put<AdminPost>(`${ADMIN_URL}/posts/${encodeURIComponent(id)}`, input);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${ADMIN_URL}/posts/${encodeURIComponent(id)}`);
  }

  getProfile(): Observable<AdminProfile> {
    return this.http.get<AdminProfile>(`${ADMIN_URL}/profile`);
  }

  updateProfile(input: ProfileInput): Observable<AdminProfile> {
    return this.http.put<AdminProfile>(`${ADMIN_URL}/profile`, input);
  }

  listContactLinks(): Observable<ContactLink[]> {
    return this.http.get<ContactLink[]>(`${ADMIN_URL}/contact-links`);
  }

  createContactLink(input: ContactLinkInput): Observable<ContactLink> {
    return this.http.post<ContactLink>(`${ADMIN_URL}/contact-links`, input);
  }

  updateContactLink(id: string, input: ContactLinkInput): Observable<ContactLink> {
    return this.http.put<ContactLink>(
      `${ADMIN_URL}/contact-links/${encodeURIComponent(id)}`,
      input,
    );
  }

  deleteContactLink(id: string): Observable<void> {
    return this.http.delete<void>(`${ADMIN_URL}/contact-links/${encodeURIComponent(id)}`);
  }

  listTaxonomy(kind: TaxonomyKind): Observable<TaxonomyTerm[]> {
    return this.http.get<TaxonomyTerm[]>(`${ADMIN_URL}/taxonomy/${kind}`);
  }

  createTaxonomy(kind: TaxonomyKind, input: TaxonomyInput): Observable<TaxonomyTerm> {
    return this.http.post<TaxonomyTerm>(`${ADMIN_URL}/taxonomy/${kind}`, input);
  }

  updateTaxonomy(kind: TaxonomyKind, id: string, input: TaxonomyInput): Observable<TaxonomyTerm> {
    return this.http.put<TaxonomyTerm>(
      `${ADMIN_URL}/taxonomy/${kind}/${encodeURIComponent(id)}`,
      input,
    );
  }

  deleteTaxonomy(kind: TaxonomyKind, id: string): Observable<void> {
    return this.http.delete<void>(`${ADMIN_URL}/taxonomy/${kind}/${encodeURIComponent(id)}`);
  }

  listMedia(limit = 100, offset = 0): Observable<PageResult<AdminMedia>> {
    return this.http.get<PageResult<AdminMedia>>(`${ADMIN_URL}/media`, {
      params: this.pageParams(limit, offset),
    });
  }

  uploadMedia(file: File, altText: string): Observable<AdminMedia> {
    const body = new FormData();
    body.append('file', file);
    body.append('alt_text', altText);
    return this.http.post<AdminMedia>(`${ADMIN_URL}/media`, body);
  }

  deleteMedia(id: string): Observable<void> {
    return this.http.delete<void>(`${ADMIN_URL}/media/${encodeURIComponent(id)}`);
  }

  private pageParams(limit: number, offset: number): HttpParams {
    return new HttpParams().set('limit', limit).set('offset', offset);
  }
}
