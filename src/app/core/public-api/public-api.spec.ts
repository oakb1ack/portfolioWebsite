import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MediaUrlService } from './media-url.service';
import { ProjectsApiService } from './projects-api.service';

describe('public API clients', () => {
  let http: HttpTestingController;
  let projects: ProjectsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    projects = TestBed.inject(ProjectsApiService);
  });

  afterEach(() => http.verify());

  it('sends pagination and taxonomy filters when listing projects', async () => {
    const response = {
      items: [],
      total: 0,
      limit: 12,
      offset: 24,
    };
    const result = firstValueFrom(
      projects.list({
        limit: 12,
        offset: 24,
        tag: 'angular',
        category: 'case-studies',
      }),
    );

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/projects');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('12');
    expect(request.request.params.get('offset')).toBe('24');
    expect(request.request.params.get('tag')).toBe('angular');
    expect(request.request.params.get('category')).toBe('case-studies');
    request.flush(response);

    await expect(result).resolves.toEqual(response);
  });

  it('normalizes RFC 7807 responses', async () => {
    const result = firstValueFrom(projects.get('missing'));
    const request = http.expectOne('/api/v1/projects/missing');

    request.flush(
      {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'The requested resource does not exist.',
        instance: '/api/v1/projects/missing',
      },
      { status: 404, statusText: 'Not Found' },
    );

    await expect(result).rejects.toMatchObject({
      name: 'PublicApiError',
      status: 404,
      message: 'The requested resource does not exist.',
    });
  });

  it('builds encoded same-origin media URLs', () => {
    const mediaUrls = TestBed.inject(MediaUrlService);

    expect(mediaUrls.publicUrl('asset/one')).toBe('/api/v1/media/asset%2Fone');
  });
});
