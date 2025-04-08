export const DEFAULT_LANGUAGE = 'en';
export const VI_LANGUAGE = 'vi';

export const DEFAULT_CURRENCY: string = 'USD';
export const VI_CURRENCY: string = 'VND';
export const EXCHANGE_RATE_VN_USD: number = 25000;
export const LOCALE_STRING_VN: string = 'vi-VN';
export const LOCALE_STRING_US: string = 'en-US';
export interface SearchParams {
  documentType: "incoming-document" | "outgoing-document";
  issuedDateFrom?: string;
  issuedDateTo?: string;
  author?: string;
  referenceNumber?: string;
  summary?: string;
}

export interface SearchResultDocument {
  id: number;
  documentNumber?: string;
  receivedDate?: string;
  issuedDate: string; // The original date as string
  referenceNumber: string;
  author: string;
  summary: string;
  priority?: string;
  dueDate?: string;
  type?: string;
  receivingMethod?: string;
  attachments?: string[];
  processingOpinion?: string;
  status?: string;
  signedBy?: string;
  // For sorting
  issuedDateObj?: Date | null;
}

export interface AttachmentDetail {
  fileName: string;
  fileUrl: string;
}
