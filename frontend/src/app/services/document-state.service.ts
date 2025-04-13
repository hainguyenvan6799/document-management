import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentStateService {
  currentTab = signal<'incomingDocuments' | 'outgoingDocuments'>('incomingDocuments');

  setCurrentTab(tab: 'incomingDocuments' | 'outgoingDocuments') {
    this.currentTab.set(tab);
  }
}