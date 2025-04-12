import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { SearchParams } from '../commons/constants';
import { HttpClientService } from './http-client.service';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private httpClientService = inject(HttpClientService);

  currentAdd: WritableSignal<string> = signal('');

  searchIncomingDocuments$(params: SearchParams) {
    return this.httpClientService.comonGet({
      url: `${environment.RESOURCE_URL}/incoming-documents/search`,
      params: params,
    });
  }

  searchOutgoingDocuments$(params: SearchParams) {
    return this.httpClientService.comonGet({
      url: `${environment.RESOURCE_URL}/outgoing-documents/search`,
      params: params,
    });
  }

  downloadAttachment$(
    filename: string,
    documentType: 'incoming-document' | 'outgoing-document'
  ) {
    const routeName =
      documentType === 'incoming-document'
        ? 'incoming-documents'
        : 'outgoing-documents';
    return this.httpClientService.comonGet({
      url: `${environment.RESOURCE_URL}/${routeName}/attachments/${filename}`,
      responseType: 'blob',
    });
  }

  getIncomingDocument$() {
    return this.httpClientService.comonGet({
      url: `${environment.RESOURCE_URL}/incoming-documents`,
    });
  }
  getOutcomingDocument$() {
    return this.httpClientService.comonGet({
      url: `${environment.RESOURCE_URL}/outgoing-documents`,
    });
  }

  getDocuments(page: number = 1, pageSize: number = 10) {
    return this.httpClientService.comonGet({
      url: `${environment.RESOURCE_URL}/incoming-documents`,
      params: { page, pageSize },
    });
  }

  getOutgoingDocuments(page: number = 1, pageSize: number = 10) {
    return this.httpClientService.comonGet({
      url: `${environment.RESOURCE_URL}/outgoing-documents`,
      params: { page, pageSize },
    });
  }

  updateDocumentStatus(
    documentNumber: string,
    status: string,
    isIncoming: boolean = true
  ) {
    const documentType = isIncoming
      ? 'incoming-documents'
      : 'outgoing-documents';
    return this.httpClientService.commonPatch({
      url: `${environment.RESOURCE_URL}/${documentType}/${documentNumber}/status`,
      headers: {},
      params: {},
      body: { status },
    });
  }

  updateDocument(
    documentNumber: string,
    updateData: any,
    isIncoming: boolean = true
  ) {
    const documentType = isIncoming
      ? 'incoming-documents'
      : 'outgoing-documents';
    return this.httpClientService.commonPatch({
      url: `${environment.RESOURCE_URL}/${documentType}/${documentNumber}`,
      headers: {},
      params: {},
      body: updateData,
    });
  }
  deleteFile$(props: {
    documentNumber: string;
    filename: string;
    isIncoming?: boolean;
  }) {
    const { documentNumber, filename, isIncoming = true } = props;
    const documentType = isIncoming
      ? 'incoming-documents'
      : 'outgoing-documents';
    return this.httpClientService.commonDelete({
      url: `${environment.RESOURCE_URL}/${documentType}/${documentNumber}/${filename}`,
    });
  }
  getDocument$(props: { documentNumber: string; isIncoming?: boolean }) {
    const { documentNumber, isIncoming = true } = props;
    const documentType = isIncoming
      ? 'incoming-documents'
      : 'outgoing-documents';
    return this.httpClientService.comonGet({
      url: `${environment.RESOURCE_URL}/${documentType}/${documentNumber}`,
    });
  }
}
