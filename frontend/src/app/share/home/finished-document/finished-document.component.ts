import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { L10nTranslateAsyncPipe } from 'angular-l10n';
import { DocumentService } from '../../../services/document.service';
import { RecipientLabelPipe } from '../../pipes/recipient-label.pipe';

@Component({
  selector: 'app-finished-document',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    L10nTranslateAsyncPipe,
    RecipientLabelPipe,
  ],
  templateUrl: './finished-document.component.html',
  styles: [
    `
      .highlight-row {
        background-color: #b3e5fc;
        border-left: 4px solid #0288d1;
        animation: pulseBackground 1.5s ease-in-out;
        animation-iteration-count: 2;
        animation-fill-mode: forwards;
      }

      @keyframes pulseBackground {
        0% {
          background-color: #b3e5fc;
        }
        50% {
          background-color: #4fc3f7;
        }
        100% {
          background-color: #b3e5fc;
        }
      }

      .text-success {
        color: #28a745 !important;
      }
    `,
  ],
})
export class FinishedDocumentComponent implements AfterViewChecked {
  @Input() finishedDocuments: any[] = [];
  @Input() columns: string[] = [];
  @Input() currentPage = 0;
  @Input() pageSize = 10;
  @Input() totalItems = 0;
  @Input() recentlyFinishedDocId: string | null = null;

  @Output() pageChanged = new EventEmitter<PageEvent>();
  @Output() openDialog = new EventEmitter<void>();
  protected documentService: DocumentService = inject(DocumentService);
  private previousFinishedDocId: string | null = null;

  ngAfterViewChecked() {
    // Kiểm tra nếu ID vừa được thay đổi
    if (
      this.recentlyFinishedDocId &&
      this.recentlyFinishedDocId !== this.previousFinishedDocId
    ) {
      this.scrollToHighlightedRow();
      this.previousFinishedDocId = this.recentlyFinishedDocId;
    }
  }

  scrollToHighlightedRow() {
    if (this.recentlyFinishedDocId) {
      setTimeout(() => {
        const element = document.getElementById(
          `doc-${this.recentlyFinishedDocId}`
        );
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100); // Đợi một chút để đảm bảo DOM đã được cập nhật
    }
  }
}
