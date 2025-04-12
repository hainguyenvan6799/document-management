import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
  Inject,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { L10nTranslateAsyncPipe } from 'angular-l10n';
import { MessageService } from 'primeng/api';
import { DocumentService } from '../../../services/document.service';
import { MOVE_CV } from '../../constant';
import { RecipientLabelPipe } from '../../pipes/recipient-label.pipe';
import { ToastModule } from 'primeng/toast';
import { AttachmentDetail } from '../../../commons/constants';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CcMatSelectComponent } from '../../../commons/cc-mat-select/cc-mat-select.component';
import { CcButtonComponent } from '../../../commons/cc-button/cc-button.component';

type TransferDialogResult = {
  selectedRecipients: Array<"staff" | "staff-management" | "teacher">;
}

@Component({
  selector: 'app-incoming-document',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    L10nTranslateAsyncPipe,
    RecipientLabelPipe,
    CcButtonComponent,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './incoming-document.component.html',
  styleUrl: './incoming-document.component.scss',
})
export class IncomingDocumentComponent implements OnInit {
  protected router: Router = inject(Router);
  protected documentService = inject(DocumentService);
  protected messageService = inject(MessageService);
  protected dialog = inject(MatDialog);

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

  // Columns for incoming documents
  waitingColumns = signal([
    'stt',
    'documentNumber',
    'receivedDate',
    'documentInfomation',
    'priority',
    'dueDate',
    'sender',
    'content',
    'process',
  ]);

  finishedColumns = signal([
    'stt',
    'documentNumber',
    'receivedDate',
    'documentInfomation',
    'priority',
    'dueDate',
    'sender',
    'content',
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

  // Constants
  MOVE_CV = MOVE_CV;

  // Event outputs to parent component
  @Output() openMoveDialog = new EventEmitter<any>();

  // Recipient options for the select component
  recipientOptions = [
    { label: 'Nhân viên', value: 'staff' },
    { label: 'CBQL', value: 'management-staff' },
    { label: 'Giáo viên', value: 'teacher' },
  ];

  ngOnInit() {
    this.loadIncomingDocuments();

    // Check if there's a document to highlight from the document service
    if (this.documentService.currentAdd()) {
      this.goToDocument(this.documentService.currentAdd());
    }
  }

  loadIncomingDocuments() {
    this.documentService.getDocuments(1, 1000).subscribe({
      next: async (response: any) => {
        if (response && response.data) {
          const { documents } = response.data;

          const enhancedDocuments = await Promise.all(
            documents.map((doc: any) => this.mappingDataForDisplaying(doc))
          );

          // Store all documents
          this.allDocuments.set(enhancedDocuments);

          // Calculate total items for each table
          const waitingDocs = documents.filter(
            (doc: any) => doc.status === 'waiting'
          );
          const finishedDocs = documents.filter(
            (doc: any) => doc.status !== 'waiting'
          );

          this.waitingTotalItems.set(waitingDocs.length);
          this.finishedTotalItems.set(finishedDocs.length);
        }
      },
      error: (error: any) => {
        console.error('Error loading incoming documents:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load incoming documents',
        });
      },
    });
  }

  private async mappingDataForDisplaying(document: any) {
    const attachmentData = await this.getAttachmentUrls(document.attachments);
    return {
      ...document,
      attachmentDetails: attachmentData,
      internalRecipientLabels: this.mappingLabelsForInternalRecipient(document),
    }
  }

  private mappingLabelsForInternalRecipient(document: any) {
    const selectedRecipientLabels = this.recipientOptions.filter((recipient) => document.internalRecipients.includes(recipient.value)).map((recipient) => recipient.label);
    return selectedRecipientLabels.join(', ');
  }

  private async getAttachmentUrls(attachments: string[] | undefined): Promise<AttachmentDetail[]> {
    if (!attachments) return [];

    try {
      const urlPromises = attachments.map(async (attachment) => {
        return new Promise<AttachmentDetail>((resolve, reject) => {
          this.documentService
            .downloadAttachment$(attachment, 'incoming-document')
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
    this.router.navigate(['modify-document', document.documentNumber]);

    // Highlight và scroll đến document
    this.recentlyFinishedDoc.set(document.id);

    // Tính toán vị trí pagination
    const allDocs = this.allDocuments();
    const finishedDocs = allDocs.filter((doc) => doc.status !== 'waiting');

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
      (doc) => doc.id === document.id
    );

    if (docPositionInSorted !== -1) {
      const targetPage = Math.floor(
        docPositionInSorted / this.finishedPageSize()
      );
      this.finishedCurrentPage.set(targetPage);
    }
  }

  finishDocument(document: any) {
    this.documentService
      .updateDocumentStatus(document.documentNumber, 'finished')
      .subscribe({
        next: (response: any) => {
          this.documentService.currentAdd.set('');
          const allDocs = this.allDocuments();
          const docIndex = allDocs.findIndex((doc) => doc.id === document.id);

          if (docIndex !== -1) {
            const updatedDoc = { ...allDocs[docIndex], status: 'finished' };
            const newAllDocs = [...allDocs];
            newAllDocs[docIndex] = updatedDoc;
            this.allDocuments.set(newAllDocs);
            this.recentlyFinishedDoc.set(document.id);

            const waitingDocs = newAllDocs.filter(
              (doc) => doc.status === 'waiting'
            );
            const finishedDocs = newAllDocs.filter(
              (doc) => doc.status !== 'waiting'
            );
            this.waitingTotalItems.set(waitingDocs.length);
            this.finishedTotalItems.set(finishedDocs.length);

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
              (doc) => doc.id === document.id
            );

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

  // Method to update the list after transferring a document
  updateUIAfterTransfer(document: any) {
    if (!document) return;
    const allDocs = this.allDocuments();
    const docIndex = allDocs.findIndex((doc) => doc.id === document.id);

    if (docIndex === -1) return;

    // Change status from "waiting" to "finished"
    const updatedDoc = { ...allDocs[docIndex], status: 'finished', internalRecipientLabels: this.mappingLabelsForInternalRecipient(document) };

    // Update allDocuments array with modified document
    const newAllDocs = [...allDocs];
    newAllDocs[docIndex] = updatedDoc;

    // Assign new array to allDocuments signal
    this.allDocuments.set(newAllDocs);

    // Save ID of recently transferred document to highlight it
    this.recentlyFinishedDoc.set(document.id);

    // Update total elements in pagination
    const waitingDocs = newAllDocs.filter((doc) => doc.status === 'waiting');
    const finishedDocs = newAllDocs.filter((doc) => doc.status !== 'waiting');
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

    // First set the highlighted document
    this.recentlyFinishedDoc.set(documentId);

    // Wait for documents to load
    setTimeout(() => {
      const allDocs = this.allDocuments();
      if (!allDocs.length) return;

      const doc = allDocs.find((d) => d.id === documentId);
      if (!doc) return;

      // Calculate the page
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
    }, 300);
  }

  // Method to open the transfer dialog at the clicked position
  openTransferDialog(event: MouseEvent, document: any) {
    event.preventDefault();
    event.stopPropagation();

    const remainingInternalRecipients = this.recipientOptions.filter((option: {label: string, value: string}) => !document.internalRecipients.includes(option.value));
    
    const dialogConfig = new MatDialogConfig();
    const buttonElement = event.target as HTMLElement;
    const buttonRect = buttonElement.getBoundingClientRect();
    
    // Calculate position to the left of the button
    dialogConfig.position = { 
      top: `${buttonRect.top}px`,
      left: `${buttonRect.left - 320}px` // 300px width + 20px margin
    };
    dialogConfig.width = '300px';
    dialogConfig.panelClass = 'transfer-dialog';
    dialogConfig.data = {
      document,
      recipientOptions: remainingInternalRecipients
    };
    
    const dialogRef = this.dialog.open(TransferDialogComponent, dialogConfig);
    
    dialogRef.afterClosed().subscribe((result: TransferDialogResult) => {
      this.documentService.updateDocument(
        document.documentNumber,
        {
          status: 'finished',
          internalRecipients: [...document.internalRecipients, ...result.selectedRecipients],
        },
        true
      ).subscribe({
        next: (response: any) => {
          this.updateUIAfterTransfer(response.document);
        },
        error: (error: any) => {
          console.error('Lỗi khi cập nhật văn bản:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật văn bản. Vui lòng thử lại sau.',
          });
        },
      });
    });
  }
}

// Dialog component for transfer
@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [CommonModule, CcMatSelectComponent, CcButtonComponent, ToastModule],
  providers: [MessageService],
  template: `
    <div class="transfer-dialog-container">
      <cc-mat-select
        [options]="data.recipientOptions"
        [multiple]="true"
        [label]="'Chọn nơi nhận'"
        [placeholder]="'Chọn...'"
        [appearance]="'outline'"
        (selectionChange)="onSelectionChange($event)"
      ></cc-mat-select>
      <div class="dialog-actions">
        <cc-button mode="secondary" title="Hủy" (onClick)="cancel()"></cc-button>
        <cc-button title="Xác nhận" (onClick)="confirm()"></cc-button>
      </div>
    </div>
    <p-toast></p-toast>
  `,
  styles: [`
    .transfer-dialog-container {
      padding: 16px;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
      gap: 8px;
    }
  `]
})
export class TransferDialogComponent {
  selectedRecipients: string[] = [];
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<TransferDialogComponent>,
    private messageService: MessageService
  ) {}
  
  onSelectionChange(event: any) {
    this.selectedRecipients = event.value;
  }
  
  cancel() {
    this.dialogRef.close();
  }
  
  confirm() {
    if (this.selectedRecipients.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng chọn người nhận',
      });
      return;
    }
    this.dialogRef.close({ selectedRecipients: this.selectedRecipients });
  }
}
