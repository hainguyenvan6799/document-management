import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { finalize } from 'rxjs';

const baseHeaders = new HttpHeaders().set('X-Debug-Level', 'minimal');
@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  protected httpClient = inject(HttpClient);
  loading: WritableSignal<boolean> = signal(false);
  comonGet(props: {
    url: string;
    headers?: {};
    params?: {};
    responseType?: 'json' | 'blob' | 'text';
  }) {
    const { url, headers, params, responseType } = props;
    this.loading.set(true);
    return this.httpClient
      .get(url, {
        headers: baseHeaders,
        params: params,
        responseType: responseType as any,
      })
      .pipe(finalize(() => this.loading.set(false)));
  }
  comonPost(props: { url: string; headers?: {}; params?: {}; body: {} }) {
    const { url, headers, params, body } = props;
    this.loading.set(true);
    return this.httpClient
      .post(url, body, { headers: baseHeaders })
      .pipe(finalize(() => this.loading.set(false)));
  }
  commonPatch(props: { url: string; headers?: {}; params?: {}; body: {} }) {
    const { url, headers, params, body } = props;
    this.loading.set(true);
    return this.httpClient
      .patch(url, body, { headers: baseHeaders })
      .pipe(finalize(() => this.loading.set(false)));
  }
  commonDelete(props: { url: string; headers?: {}; params?: {} }) {
    const { url, headers, params } = props;
    this.loading.set(true);
    return this.httpClient
      .delete(url, { headers: baseHeaders })
      .pipe(finalize(() => this.loading.set(false)));
  }
}
