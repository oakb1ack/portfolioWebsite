import { HttpParams } from '@angular/common/http';
import { ContentListQuery, PageQuery } from './public-api.models';

export function pageParams(query: PageQuery = {}): HttpParams {
  let params = new HttpParams();

  if (query.limit !== undefined) {
    params = params.set('limit', query.limit);
  }
  if (query.offset !== undefined) {
    params = params.set('offset', query.offset);
  }

  return params;
}

export function contentListParams(query: ContentListQuery = {}): HttpParams {
  let params = pageParams(query);

  if (query.tag) {
    params = params.set('tag', query.tag);
  }
  if (query.category) {
    params = params.set('category', query.category);
  }

  return params;
}
