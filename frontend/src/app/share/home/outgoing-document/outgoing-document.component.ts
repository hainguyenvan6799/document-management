import { CommonModule, NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { L10nTranslateAsyncPipe } from 'angular-l10n';
import { MessageService } from 'primeng/api';
import { AttachmentDetail } from '../../../commons/constants';
import { DocumentService } from '../../../services/document.service';
import { MOVE_CV } from '../../constant';
import { RecipientLabelPipe } from '../../pipes/recipient-label.pipe';

@Component({
  selector: 'app-outgoing-document',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    L10nTranslateAsyncPipe,
    RecipientLabelPipe,
    NgClass,
  ],
  templateUrl: './outgoing-document.component.html',
  styleUrl: './outgoing-document.component.scss',
})
export class OutgoingDocumentComponent implements OnInit {
  protected router: Router = inject(Router);
  protected documentService = inject(DocumentService);
  protected messageService = inject(MessageService);

  showNoAttachmentsMessage = signal<boolean>(false);

  // Signals for component state
  allDocuments = signal<any[]>([]);
  waitingDocumentsAll = computed(() => {
    const filtered = this.allDocuments().filter(
      (doc) => doc.status === 'waiting'
    );
    return filtered.sort((a, b) => {
      const numA =
        typeof a.documentNumber === 'string'
          ? parseInt(a.documentNumber.replace(/\D/g, ''))
          : a.documentNumber;
      const numB =
        typeof b.documentNumber === 'string'
          ? parseInt(b.documentNumber.replace(/\D/g, ''))
          : b.documentNumber;
      return numA - numB;
    });
  });

  finishedDocumentsAll = computed(() => {
    const filtered = this.allDocuments().filter(
      (doc) => doc.status !== 'waiting'
    );
    return filtered.sort((a, b) => {
      const numA =
        typeof a.documentNumber === 'string'
          ? parseInt(a.documentNumber.replace(/\D/g, ''))
          : a.documentNumber;
      const numB =
        typeof b.documentNumber === 'string'
          ? parseInt(b.documentNumber.replace(/\D/g, ''))
          : b.documentNumber;
      return numA - numB;
    });
  });

  // Documents to display after pagination
  waitingDocuments = computed(() => {
    const filteredDocs = this.waitingDocumentsAll();
    const startIndex = this.waitingCurrentPage() * this.waitingPageSize();
    return filteredDocs.slice(startIndex, startIndex + this.waitingPageSize());
  });

  finishedDocuments = computed(() => {
    const filteredDocs = this.finishedDocumentsAll();
    const startIndex = this.finishedCurrentPage() * this.finishedPageSize();
    return filteredDocs.slice(startIndex, startIndex + this.finishedPageSize());
  });

  // Columns for outgoing documents - different columns from incoming
  waitingColumns = signal([
    'stt',
    'documentNumber',
    'issuedDate',
    'author',
    'summary',
    'attachments',
    'process',
  ]);

  finishedColumns = signal([
    'stt',
    'documentNumber',
    'issuedDate',
    'author',
    'summary',
    'attachments',
    'process',
    'internalRecipient',
  ]);

  // Pagination signals
  waitingCurrentPage = signal<number>(0);
  waitingPageSize = signal<number>(3);
  waitingTotalItems = signal<number>(0);

  finishedCurrentPage = signal<number>(0);
  finishedPageSize = signal<number>(3);
  finishedTotalItems = signal<number>(0);

  // Signal for highlighting recently finished document
  recentlyFinishedDoc = signal<string | null>(null);

  // Signal for highlighting recently recovered document
  recentlyRecoveredDoc = signal<string | null>(null);

  // Constants
  MOVE_CV = MOVE_CV;

  // Event outputs to parent component
  @Output() openMoveDialog = new EventEmitter<any>();

  ngOnInit() {
    this.loadOutgoingDocuments();

    // Check if there's a document to highlight from the document service
    if (this.documentService.currentAdd()) {
      this.goToDocument(this.documentService.currentAdd());
    }
  }

  loadOutgoingDocuments() {
    this.documentService.getOutgoingDocuments(1, 1000).subscribe({
      next: async (response: any) => {
        if (response && response.data) {
          const { documents } = response.data;

          // Enhance documents with attachment information
          const enhancedDocuments = await Promise.all(
            documents.map((doc: any) => this.mappingDataForDisplaying(doc))
          );

          // Store all documents
          this.allDocuments.set(enhancedDocuments);

          // Calculate total items for each table
          const waitingDocs = enhancedDocuments.filter(
            (doc: any) => doc.status === 'waiting'
          );
          const finishedDocs = enhancedDocuments.filter(
            (doc: any) => doc.status !== 'waiting'
          );

          this.waitingTotalItems.set(waitingDocs.length);
          this.finishedTotalItems.set(finishedDocs.length);
        }
      },
      error: (error: any) => {
        console.error('Error loading outgoing documents:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load outgoing documents',
        });
      },
    });
  }

  private async mappingDataForDisplaying(document: any) {
    const attachmentData = await this.getAttachmentUrls(document.attachments);
    return {
      ...document,
      attachmentDetails: attachmentData,
    };
  }

  private async getAttachmentUrls(
    attachments: string[] | undefined
  ): Promise<AttachmentDetail[]> {
    if (!attachments) return [];

    try {
      const urlPromises = attachments.map(async (attachment) => {
        return new Promise<AttachmentDetail>((resolve, reject) => {
          this.documentService
            .downloadAttachment$(attachment, 'outgoing-document')
            .subscribe({
              next: (blob: any) => {
                const url = window.URL.createObjectURL(blob);
                resolve({ fileName: attachment, fileUrl: url });
              },
              error: () => {
                resolve({fileName: attachment, fileUrl: ''});
              }
            });
        });
      });

      return await Promise.all(urlPromises);
    } catch (error) {
      console.error('Error retrieving attachment URLs:', error);
      return [];
    }
  }

  handleWaitingPageEvent(event: PageEvent) {
    this.waitingPageSize.set(event.pageSize);
    this.waitingCurrentPage.set(event.pageIndex);
  }

  handleFinishedPageEvent(event: PageEvent) {
    this.finishedPageSize.set(event.pageSize);
    this.finishedCurrentPage.set(event.pageIndex);
  }

  returnDocument(document: any) {
    this.router.navigate(['add-outgoing-document', document.documentNumber]);

    // Highlight document when returning to viewing page
    if (document.status !== 'waiting') {
      this.recentlyFinishedDoc.set(document.id);
    } else {
      this.recentlyRecoveredDoc.set(document.id);
    }
  }

  finishDocument(document: any) {
    this.documentService
      .updateDocumentStatus(document.documentNumber, 'finished', false)
      .subscribe({
        next: (response: any) => {
          this.documentService.currentAdd.set('');
          const allDocs = this.allDocuments();
          const docIndex = allDocs.findIndex((doc) => doc.id === document.id);

          if (docIndex !== -1) {
            // Change status from "waiting" to "finished"
            const updatedDoc = { ...allDocs[docIndex], status: 'finished' };

            // Update allDocuments array with the modified document
            const newAllDocs = [...allDocs];
            newAllDocs[docIndex] = updatedDoc;

            // Assign new array to allDocuments signal
            this.allDocuments.set(newAllDocs);

            // Save ID of recently finished document to highlight it
            this.recentlyFinishedDoc.set(document.id);

            // Update total elements in pagination
            const waitingDocs = newAllDocs.filter(
              (doc) => doc.status === 'waiting'
            );
            const finishedDocs = newAllDocs.filter(
              (doc) => doc.status !== 'waiting'
            );
            this.waitingTotalItems.set(waitingDocs.length);
            this.finishedTotalItems.set(finishedDocs.length);

            // Find document in sorted list of finished documents
            const sortedFinishedDocs = finishedDocs.sort((a, b) => {
              const numA =
                typeof a.documentNumber === 'string'
                  ? parseInt(a.documentNumber.replace(/\D/g, ''))
                  : a.documentNumber;
              const numB =
                typeof b.documentNumber === 'string'
                  ? parseInt(b.documentNumber.replace(/\D/g, ''))
                  : b.documentNumber;
              return numA - numB;
            });

            // Find position of document in sorted list
            const docPositionInSorted = sortedFinishedDocs.findIndex(
              (doc) => doc.id === document.id
            );

            // Calculate page containing document according to page size
            if (docPositionInSorted !== -1) {
              const targetPage = Math.floor(
                docPositionInSorted / this.finishedPageSize()
              );
              this.finishedCurrentPage.set(targetPage);
            }
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã kết thúc văn bản số ${document.documentNumber}`,
          });
        },
        error: (error) => {
          console.error('Lỗi khi cập nhật trạng thái:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail:
              'Không thể cập nhật trạng thái văn bản. Vui lòng thử lại sau.',
          });
        },
      });
  }

  // Method for document recovery
  publishDocument(document: any) {
    // Update status on the server
    this.documentService
      .updateDocumentStatus(document.documentNumber, 'finished', false)
      .subscribe({
        next: (response: any) => {
          console.log('Server response:', response);

          // Once updated on server, proceed to update UI
          const allDocs = this.allDocuments();
          const docIndex = allDocs.findIndex((doc) => doc.id === document.id);

          if (docIndex !== -1) {
            // Change status from "waiting" to "finished"
            const updatedDoc = { ...allDocs[docIndex], status: 'finished' };

            // Update allDocuments array with modified document
            const newAllDocs = [...allDocs];
            newAllDocs[docIndex] = updatedDoc;

            // Assign new array to allDocuments signal
            this.allDocuments.set(newAllDocs);

            // Save ID of recently finished document to highlight it
            this.recentlyFinishedDoc.set(document.id);

            // Update total elements in pagination
            const waitingDocs = newAllDocs.filter(
              (doc) => doc.status === 'waiting'
            );
            const finishedDocs = newAllDocs.filter(
              (doc) => doc.status !== 'waiting'
            );
            this.waitingTotalItems.set(waitingDocs.length);
            this.finishedTotalItems.set(finishedDocs.length);

            // Find document in sorted list of finished documents
            const sortedFinishedDocs = finishedDocs.sort((a, b) => {
              const numA =
                typeof a.documentNumber === 'string'
                  ? parseInt(a.documentNumber.replace(/\D/g, ''))
                  : a.documentNumber;
              const numB =
                typeof b.documentNumber === 'string'
                  ? parseInt(b.documentNumber.replace(/\D/g, ''))
                  : b.documentNumber;
              return numA - numB;
            });

            // Find position of document in sorted list
            const docPositionInSorted = sortedFinishedDocs.findIndex(
              (doc) => doc.id === document.id
            );

            // Calculate page containing document according to page size
            if (docPositionInSorted !== -1) {
              const targetPage = Math.floor(
                docPositionInSorted / this.finishedPageSize()
              );
              this.finishedCurrentPage.set(targetPage);
            }

            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã phát hành văn bản số ${document.documentNumber}`,
            });
          } else {
            // If document not found in local state, reload all documents
            console.log('Document not found in local state, reloading...');
            this.loadOutgoingDocuments();

            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã phát hành văn bản số ${document.documentNumber}`,
            });
          }
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Unable to publish document. Please try again later.',
          });
        },
      });
  }

  // Method for additional publishing of a document
  additionalPublish(document: any) {
    // Show confirmation message
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: `Đang thực hiện phát hành bổ sung cho văn bản số ${document.documentNumber}`,
    });

    // Logic for additional publication could be implemented here
    // For now we just show a success message after a brief delay
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: `Đã phát hành bổ sung văn bản số ${document.documentNumber}`,
      });
    }, 1000);
  }

  // Method to recover a document
  recoverDocument(document: any) {
    // Update status on the server
    this.documentService
      .updateDocumentStatus(document.documentNumber, 'waiting', false)
      .subscribe({
        next: (response: any) => {
          console.log('Server response:', response);

          // Once updated on server, proceed to update UI
          const allDocs = this.allDocuments();
          const docIndex = allDocs.findIndex((doc) => doc.id === document.id);

          if (docIndex !== -1) {
            // Change status from "finished" to "waiting"
            const updatedDoc = { ...allDocs[docIndex], status: 'waiting' };

            // Update allDocuments array with modified document
            const newAllDocs = [...allDocs];
            newAllDocs[docIndex] = updatedDoc;

            // Assign new array to allDocuments signal
            this.allDocuments.set(newAllDocs);

            // Save ID of recently recovered document to highlight it
            this.recentlyRecoveredDoc.set(document.id);

            // Update total elements in pagination
            const waitingDocs = newAllDocs.filter(
              (doc) => doc.status === 'waiting'
            );
            const finishedDocs = newAllDocs.filter(
              (doc) => doc.status !== 'waiting'
            );
            this.waitingTotalItems.set(waitingDocs.length);
            this.finishedTotalItems.set(finishedDocs.length);

            // Find document in sorted list of waiting documents
            const sortedWaitingDocs = waitingDocs.sort((a, b) => {
              const numA =
                typeof a.documentNumber === 'string'
                  ? parseInt(a.documentNumber.replace(/\D/g, ''))
                  : a.documentNumber;
              const numB =
                typeof b.documentNumber === 'string'
                  ? parseInt(b.documentNumber.replace(/\D/g, ''))
                  : b.documentNumber;
              return numA - numB;
            });

            // Find position of document in sorted list
            const docPositionInSorted = sortedWaitingDocs.findIndex(
              (doc) => doc.id === document.id
            );

            // Calculate page containing document according to page size
            if (docPositionInSorted !== -1) {
              const targetPage = Math.floor(
                docPositionInSorted / this.waitingPageSize()
              );
              this.waitingCurrentPage.set(targetPage);
            }

            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã lấy lại văn bản số ${document.documentNumber}`,
            });
          } else {
            // If document not found in local state, reload all documents
            console.log('Document not found in local state, reloading...');
            this.loadOutgoingDocuments();

            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã lấy lại văn bản số ${document.documentNumber}`,
            });
          }
        },
        error: (error) => {
          console.error('Error when recovering document:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Cannot recover document. Please try again later.',
          });
        },
      });
  }

  updateAfterPublish(document: any) {
    const allDocs = this.allDocuments();
    const docIndex = allDocs.findIndex((doc) => doc.id === document.id);

    if (docIndex !== -1) {
      // Change status from "waiting" to "finished"
      const updatedDoc = { ...allDocs[docIndex], status: 'finished' };

      // Update allDocuments array with the modified document
      const newAllDocs = [...allDocs];
      newAllDocs[docIndex] = updatedDoc;

      // Assign the new array to allDocuments signal
      this.allDocuments.set(newAllDocs);

      // Save the ID of the recently finished document to highlight it
      this.recentlyFinishedDoc.set(document.id);

      // Update total items in pagination
      const waitingDocs = newAllDocs.filter((doc) => doc.status === 'waiting');
      const finishedDocs = newAllDocs.filter((doc) => doc.status !== 'waiting');
      this.waitingTotalItems.set(waitingDocs.length);
      this.finishedTotalItems.set(finishedDocs.length);

      // Find the position of the document in the sorted list
      const sortedFinishedDocs = finishedDocs.sort((a, b) => {
        const numA =
          typeof a.documentNumber === 'string'
            ? parseInt(a.documentNumber.replace(/\D/g, ''))
            : a.documentNumber;
        const numB =
          typeof b.documentNumber === 'string'
            ? parseInt(b.documentNumber.replace(/\D/g, ''))
            : b.documentNumber;
        return numA - numB;
      });

      // Find the position of the document in the sorted list
      const docPositionInSorted = sortedFinishedDocs.findIndex(
        (doc) => doc.id === document.id
      );

      // Calculate the page containing the document according to the page size
      if (docPositionInSorted !== -1) {
        const targetPage = Math.floor(
          docPositionInSorted / this.finishedPageSize()
        );
        this.finishedCurrentPage.set(targetPage);
      }
    }
  }

  getShortFileName(filename: string): string {
    // Split filename by hyphen to get the part without timestamp
    const parts = filename.split('-');

    // If there is a timestamp at the beginning (standard format), remove it
    if (parts.length > 1 && !isNaN(Number(parts[0]))) {
      // Remove the first part (timestamp) and join the remaining parts
      return parts.slice(1).join('-');
    }

    // If not in the right format or no timestamp, return the original name
    return filename;
  }

  downloadAttachment(fileUrl: string, fileName: string) {
    if (!fileUrl) return;
    this.showNoAttachmentsMessage.set(false);

    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = this.getShortFileName(fileName);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(fileUrl);
    window.document.body.removeChild(a);
  }

  // Public method to navigate to a specific document
  goToDocument(documentId: string) {
    if (!documentId) return;

    // Wait for documents to load
    setTimeout(() => {
      const allDocs = this.allDocuments();
      if (!allDocs.length) return;

      const doc = allDocs.find((d) => d.id === documentId);
      if (!doc) return;

      // Set the highlighted document based on its status
      if (doc.status === 'waiting') {
        this.recentlyRecoveredDoc.set(documentId);

        // Calculate the page for waiting documents
        const waitingDocs = allDocs.filter((d) => d.status === 'waiting');
        const sortedWaitingDocs = waitingDocs.sort((a, b) => {
          const numA =
            typeof a.documentNumber === 'string'
              ? parseInt(a.documentNumber.replace(/\D/g, ''))
              : a.documentNumber;
          const numB =
            typeof b.documentNumber === 'string'
              ? parseInt(b.documentNumber.replace(/\D/g, ''))
              : b.documentNumber;
          return numA - numB;
        });

        const docPositionInSorted = sortedWaitingDocs.findIndex(
          (d) => d.id === documentId
        );

        if (docPositionInSorted !== -1) {
          const targetPage = Math.floor(
            docPositionInSorted / this.waitingPageSize()
          );
          this.waitingCurrentPage.set(targetPage);
        }
      } else {
        this.recentlyFinishedDoc.set(documentId);

        // Calculate the page for finished documents
        const finishedDocs = allDocs.filter((d) => d.status !== 'waiting');
        const sortedFinishedDocs = finishedDocs.sort((a, b) => {
          const numA =
            typeof a.documentNumber === 'string'
              ? parseInt(a.documentNumber.replace(/\D/g, ''))
              : a.documentNumber;
          const numB =
            typeof b.documentNumber === 'string'
              ? parseInt(b.documentNumber.replace(/\D/g, ''))
              : b.documentNumber;
          return numA - numB;
        });

        const docPositionInSorted = sortedFinishedDocs.findIndex(
          (d) => d.id === documentId
        );

        if (docPositionInSorted !== -1) {
          const targetPage = Math.floor(
            docPositionInSorted / this.finishedPageSize()
          );
          this.finishedCurrentPage.set(targetPage);
        }
      }
    }, 300);
  }
}
