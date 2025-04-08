import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { L10nTranslationService } from 'angular-l10n';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  // Các nhãn sẽ được dịch theo từng ngôn ngữ
  firstPageLabel = '';
  itemsPerPageLabel = '';
  lastPageLabel = '';
  nextPageLabel = '';
  previousPageLabel = '';

  constructor(private translation: L10nTranslationService) {
    this.initTranslations();
    
    // Đăng ký sự kiện thay đổi ngôn ngữ để cập nhật labels
    this.translation.onChange().subscribe(() => {
      this.initTranslations();
      this.changes.next();
    });
  }

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      const noResultsMessage = this.translation.translate('paginatorNoResults');
      return noResultsMessage || `0 / 0`;
    }
    
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    
    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ? 
      Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    
    const ofLabel = this.translation.translate('paginatorOf') || 'of';
    return `${startIndex + 1} - ${endIndex} ${ofLabel} ${length}`;
  }

  private initTranslations(): void {
    this.firstPageLabel = this.translation.translate('paginatorFirstPage') || 'First page';
    this.itemsPerPageLabel = this.translation.translate('paginatorItemsPerPage') || 'Items per page:';
    this.lastPageLabel = this.translation.translate('paginatorLastPage') || 'Last page';
    this.nextPageLabel = this.translation.translate('paginatorNextPage') || 'Next page';
    this.previousPageLabel = this.translation.translate('paginatorPreviousPage') || 'Previous page';
  }
} 