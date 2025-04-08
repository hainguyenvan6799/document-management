import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { L10nTranslateAsyncPipe } from 'angular-l10n';
import { MessageService } from 'primeng/api';
import { CcButtonComponent } from '../../commons/cc-button/cc-button.component';
import {
  CcDialogComponent,
  TEMPLATE_TYPE,
} from '../../commons/cc-dialog/cc-dialog.component';
import { CcRadioGroupComponent } from '../../commons/cc-radio-group/cc-radio-group.component';
import { CcToggleGroupComponent } from '../../commons/cc-toggle-group/cc-toggle-group.component';
import { DocumentService } from '../../services/document.service';
import { HttpClientService } from '../../services/http-client.service';
import { MOVE_CV } from '../constant';
import { IncomingDocumentComponent } from './incoming-document/incoming-document.component';
import { OutgoingDocumentComponent } from './outgoing-document/outgoing-document.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    L10nTranslateAsyncPipe,
    MatTableModule,
    CcButtonComponent,
    MatPaginatorModule,
    CcToggleGroupComponent,
    // CcLoadingComponent,
    CcRadioGroupComponent,
    IncomingDocumentComponent,
    OutgoingDocumentComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [MessageService],
})
export class HomeComponent implements OnInit {
  protected httpClient = inject(HttpClientService);
  protected messageService = inject(MessageService);
  protected router = inject(Router);
  protected documentService = inject(DocumentService);
  protected dialog = inject(MatDialog);

  // Toggle for incoming/outgoing documents
  value = signal('incomingDocuments');
  listToggle = signal([
    {
      label: 'incomingDocuments',
    },
    { label: 'outcomingDocuments' },
  ]);

  // Constants
  MOVE_CV = MOVE_CV;

  // Template reference for the move dialog
  chuyen = viewChild.required<TemplateRef<any>>('chuyen');

  // Selected document and option for moving
  selectedOption = signal<string>('management-staff'); // Default to CBQL
  selectedDocument = signal<any>(null);
  lastMoveSuccess = signal<boolean>(false);
  lastDocumentType = signal<string>('incoming'); // 'incoming' o 'outgoing'

  // Component references
  @ViewChild('incomingDocComponent')
  incomingDocComponent?: IncomingDocumentComponent;

  ngOnInit() {
    // Kiểm tra query parameters để chuyển tab khi cần
    const queryParams = this.router.parseUrl(this.router.url).queryParams;

    // Nếu có tham số 'documentType' và giá trị là 'outgoing', chuyển đến tab outgoing-documents
    if (queryParams['documentType'] === 'outgoing') {
      this.value.set('outcomingDocuments');
    }
  }

  addDocument() {
    if (this.value() === 'incomingDocuments') {
      this.router.navigateByUrl('add-document');
    } else {
      this.router.navigateByUrl('add-outgoing-document');
    }
  }

  searchDocument() {
    this.router.navigateByUrl('search-document');
  }

  onChangeToggle(value: string): void {
    this.value.set(value);
  }

  openDialog(document: any) {
    // Reset to default option (CBQL) before opening dialog
    this.selectedOption.set('management-staff');
    // Store the document being processed
    this.selectedDocument.set(document);
    // Store document type based on current toggle
    this.lastDocumentType.set(
      this.value() === 'incomingDocuments' ? 'incoming' : 'outgoing'
    );

    const data = {
      title: 'Chọn người chuyển',
      templateType: TEMPLATE_TYPE.LITE,
    };
    const dialog = this.dialog.open(CcDialogComponent, { data });
    dialog.componentInstance.tempDialog = this.chuyen();
    return dialog;
  }

  onChange(event: string) {
    this.selectedOption.set(event);
  }

  confirmMove() {
    this.lastMoveSuccess.set(false);
    const selectedValue = this.selectedOption();
    const document = this.selectedDocument();

    if (!document) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy văn bản để cập nhật',
      });
      this.dialog.closeAll();
      return;
    }

    // Determine document type based on stored value
    const isIncoming = this.lastDocumentType() === 'incoming';

    // Call API to update document status and internal recipient
    this.documentService
      .updateDocument(
        document.documentNumber,
        {
          status: 'finished',
          internalRecipient: selectedValue,
        },
        isIncoming
      )
      .subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: `Đã cập nhật văn bản số ${document.documentNumber}`,
          });

          this.lastMoveSuccess.set(true);

          if (isIncoming && this.incomingDocComponent) {
            this.incomingDocComponent.updateAfterTransfer(
              document,
              selectedValue
            );
          }
        },
        error: (error: any) => {
          console.error('Lỗi khi cập nhật văn bản:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật văn bản. Vui lòng thử lại sau.',
          });
        },
        complete: () => {
          this.dialog.closeAll();
        },
      });
  }
}
