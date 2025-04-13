import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  AfterViewInit,
} from '@angular/core';
import { MatLabel } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { Observable } from 'rxjs';
import { CcButtonComponent } from '../../commons/cc-button/cc-button.component';
import { CcDatePickerComponent } from '../../commons/cc-date-picker/cc-date-picker.component';
import { CcInputComponent } from '../../commons/cc-input/cc-input.component';
import { CcSelectComponent } from '../../commons/cc-select/cc-select.component';
import {DocumentService} from '../../services/document.service';
import { ExportService } from '../../services/export.service';
import { AttachmentDetail, SearchParams, SearchResultDocument } from '../../commons/constants';
import { getShortFileName } from '../../utils';

interface PaginatedDocument extends SearchResultDocument {
  attachmentDetails: Array<AttachmentDetail>;
}

// Type for the entire response
interface SearchDataResponse {
  message: string;
  data: DocumentData;
}

// Type for the "data" property
interface DocumentData {
  paginatedDocuments: SearchResultDocument[];
  filteredDocuments: SearchResultDocument[];
  pagination: Pagination;
}

// Type for the pagination information
interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Define the empty form state
const emptySearchForm: SearchParams = {
  documentType: 'incoming-document',
  issuedDateFrom: '',
  issuedDateTo: '',
  author: '',
  referenceNumber: '',
  summary: ''
};

type DocumentTypeOptions = {
  label: string;
  value: "incoming-document" | "outgoing-document";
}

@Component({
  selector: 'app-search-document',
  standalone: true,
  imports: [
    CommonModule,
    CcInputComponent,
    CcDatePickerComponent,
    CcButtonComponent,
    MatLabel,
    MatTableModule,
    MatProgressSpinnerModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    MatPaginatorModule,
    CcSelectComponent,
  ],
  templateUrl: './search-document.component.html',
  styleUrl: './search-document.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchDocumentComponent implements OnInit, AfterViewInit {
  protected documentService = inject(DocumentService);
  protected exportService = inject(ExportService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Form data signal - single source of truth for form values
  searchParams: WritableSignal<SearchParams> = signal({ ...emptySearchForm });
  
  // UI state signals
  paginatedDocuments: WritableSignal<PaginatedDocument[]> = signal([]);
  filteredDocuments: WritableSignal<SearchResultDocument[]> = signal([]);
  loading: WritableSignal<boolean> = signal(false);
  hasSearched: boolean = false;
  showNoAttachmentsMessage = signal<boolean>(false);

  // Table columns configuration
  incomingColumns: string[] = [
    'stt',
    'documentNumber',
    'receivedDate',
    'issuedDate',
    'dueDate',
    'referenceNumber',
    'author',
    'summary',
    'attachments',
  ];
  outgoingColumns: string[] = [
    'stt',
    'referenceNumber',
    'issuedDate',
    'author',
    'summary',
    'attachments',
  ];
  displayedColumns: WritableSignal<string[]> = signal(this.incomingColumns);

  // Form options
  documentTypeOptions: DocumentTypeOptions[] = [
    { value: 'incoming-document', label: 'Văn bản đến' },
    { value: 'outgoing-document', label: 'Văn bản đi' },
  ];

  // Pagination properties
  pageSize: WritableSignal<number> = signal(3);
  pageSizeOptions: number[] = [3, 25, 50, 100];
  pageIndex: WritableSignal<number> = signal(0);
  totalItems: WritableSignal<number> = signal(0);

  // ViewChild references for component access
  @ViewChild('selectDocumentType') selectDocumentType!: CcSelectComponent<"incoming-document" | "outgoing-document">;
  @ViewChild('datePickerFrom') datePickerFrom!: CcDatePickerComponent;
  @ViewChild('datePickerTo') datePickerTo!: CcDatePickerComponent;
  @ViewChild('inputNumber') inputNumber!: CcInputComponent;
  @ViewChild('inputAuthor') inputAuthor!: CcInputComponent;
  @ViewChild('inputSummary') inputSummary!: CcInputComponent;

  viewInitialized = false;

  ngOnInit() {
    console.log('Search Document Component initialized');
  }

  ngAfterViewInit() {
    // Mark that view has been initialized, so we can safely access ViewChild references
    this.viewInitialized = true;
    
    // Initial sync to ensure form controls are in sync with initial values
    setTimeout(() => {
      this.syncFormControls();
    }, 0);
  }
  
  /**
   * Synchronize form controls with current values
   * This is needed because Angular's change detection might not pick up all changes
   */
  syncFormControls() {
    if (!this.viewInitialized) return;
    
    try {
      // Update document type selector
      if (this.selectDocumentType) {
        this.selectDocumentType.value = this.searchParams().documentType;
      }
      
      // Force change detection
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error synchronizing form controls:', error);
    }
  }

  private turnOffLoading() {
    this.loading.set(false);
  }
  
  private turnOnLoading() {
    this.loading.set(true);
  }

  private resetPageIndex() {
    this.pageIndex.set(0);
  }

  getShortFileName(filename: string): string {
    return getShortFileName(filename);
  }

  onChangeSearch() {
    try {
      console.log('Starting search with params:', this.searchParams());
      this.turnOnLoading();
      
      // Reset pagination when performing a new search
      this.resetPageIndex();
      
      // Execute search
      this.search(this.searchParams());
    } catch (error) {
      console.error('Error in onChangeSearch:', error);
      this.turnOffLoading();
      this.hasSearched = true;
      this.paginatedDocuments.set([]);
      
      // Force change detection if there's an error
      this.cdr.detectChanges();
    }
  }

  search(params: SearchParams) {
    console.log('Executing search with params:', params);
    
    const searchParams = {
      ...params,
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
    };
    
    // Make sure UI reflects the cleared state before new results arrive
    this.cdr.detectChanges();

    this.handleSearch(searchParams);
  }

  private searchDocuments(
    searchParams: any,
    searchFunction: (params: any) => Observable<any>
  ) {
    this.turnOnLoading()
    
    // Force change detection to show loading state
    this.cdr.detectChanges();
    
    searchFunction(searchParams).subscribe({
      next: (response: SearchDataResponse) => {
        this.filteredDocuments.set(response.data.filteredDocuments);
        this.displaySearchResult(response);
      },
      error: (err: any) => {
        console.error('Error searching documents:', err);
        this.paginatedDocuments.set([]);
        this.hasSearched = true;
        this.turnOffLoading()
        
        // Force change detection after error
        this.cdr.detectChanges();
      },
    });
  }
  
  private async displaySearchResult(response: SearchDataResponse) {
    try {
      const {
        data: { paginatedDocuments, pagination },
      } = response;

      // Update pagination information
      this.totalItems.set(pagination.totalItems);
      
      // Keep dates as strings for display, but add additional properties for sorting
      const docs = await Promise.all(paginatedDocuments.map((document) => this.mappingDataForDisplaying(document)));

      console.log({docs});
      
      // Update documents signal
      this.paginatedDocuments.set(docs);

      // Sort documents by issuedDate
      this.sortDocumentsByIssuedDate();
      
      // Make sure to set loading to false before change detection
      this.turnOffLoading()
      
      // Ensure change detection happens when we have the final results
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error processing search results:', error);
      this.paginatedDocuments.set([]);
      this.hasSearched = true;
      this.turnOffLoading()
      
      // Force change detection in case of error
      this.cdr.detectChanges();
    } finally {
      this.hasSearched = true;
      this.turnOffLoading()
      
      // Final change detection to ensure UI is consistent with state
      this.cdr.detectChanges();
    }
  }

  private async mappingDataForDisplaying(document: SearchResultDocument) {
    const attachmentData = await this.getAttachmentUrls(document.attachments);
    return {
      ...document,
      attachmentDetails: attachmentData,
      issuedDateObj: this.formatDate(document.issuedDate)
    }
  }

  private async getAttachmentUrls(attachments: string[] | undefined): Promise<AttachmentDetail[]> {
    if (!attachments) return [];

    try {
      const urlPromises = attachments.map(async (attachment) => {
        return new Promise<AttachmentDetail>((resolve, reject) => {
          this.documentService.downloadAttachment$(attachment, this.searchParams().documentType)
            .subscribe({
              next: (blob: any) => {
                const url = window.URL.createObjectURL(blob);
                resolve({fileName: attachment, fileUrl: url});
              },
              error: (err: any) => {
                console.error('Error downloading attachment:', err);
                reject(err);
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

  public handleSearch(searchParams: any) {
    if (searchParams.documentType === 'incoming-document') {
      this.searchDocuments(
        searchParams,
        this.documentService.searchIncomingDocuments$.bind(this.documentService)
      );
    } else if (searchParams.documentType === 'outgoing-document') {
      this.searchDocuments(
        searchParams,
        this.documentService.searchOutgoingDocuments$.bind(this.documentService)
      );
    } else {
      console.warn('Unknown document type:', searchParams.documentType);
      this.turnOffLoading()
    }
  }

  /**
   * Handle page change events from the paginator
   */
  onPageChange(event: PageEvent) {  
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);

    // Load data with new pagination settings
    this.turnOnLoading()
    this.search(this.searchParams());
  }

  /**
   * Sort the document list by issue date (issuedDate) in ascending order
   */
  sortDocumentsByIssuedDate() {
    try {
      const sortedDocs = [...this.paginatedDocuments()].sort((a: any, b: any) => {
        // Handle case where one of the two documents has no issue date
        if (!a.issuedDateObj) return 1; // Push documents without dates to the end
        if (!b.issuedDateObj) return -1;

        // Compare two dates using Date objects
        try {
          const dateA = a.issuedDateObj?.getTime() || 0;
          const dateB = b.issuedDateObj?.getTime() || 0;

          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;

          return dateA - dateB; // Sort in ascending order
        } catch (e) {
          console.error('Error comparing dates:', e);
          return 0;
        }
      });
      
      this.paginatedDocuments.set(sortedDocs);
      
      // Force change detection
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Error sorting documents:', e);
    }
  }

  reset() {
    try {
      console.log('Resetting search form');
      
      // Reset the form data signal to default values
      this.searchParams.set({ ...emptySearchForm });
      
      // Reset UI components
      this.resetFormComponents();
      
      // Clear results
      this.clearResults();
      
      // Update UI
      this.cdr.detectChanges();
      
      console.log('Form reset complete');
    } catch (error) {
      console.error('Error during form reset:', error);
    }
  }

  /**
   * Reset form components using ViewChild references
   */
  private resetFormComponents() {
    if (!this.viewInitialized) return;
    
    try {
      // Reset document type select if needed
      if (this.selectDocumentType) {
        this.selectDocumentType.value = this.searchParams().documentType;
      }

      // Reset date pickers
      if (this.datePickerFrom) {
        this.datePickerFrom.valueChange.emit('');
      }

      if (this.datePickerTo) {
        this.datePickerTo.valueChange.emit('');
      }

      // Reset text inputs
      if (this.inputNumber) {
        this.inputNumber.valueChange.emit('');
      }
      
      if (this.inputAuthor) {
        this.inputAuthor.valueChange.emit('');
      }
      
      if (this.inputSummary) {
        this.inputSummary.valueChange.emit('');
      }
      
      // Force change detection
      this.cdr.detectChanges();
      
      console.log('Form components reset');
    } catch (error) {
      console.error('Error resetting form components:', error);
    }
  }
  
  /**
   * Clear search results and reset display state
   */
  private clearResults() {
    // Clear results
    this.paginatedDocuments.set([]);
    this.hasSearched = false;

    // Reset pagination
    this.resetPageIndex()
    this.totalItems.set(0);

    // Reset display settings
    this.displayedColumns.set(
      this.searchParams().documentType === 'incoming-document' 
        ? this.incomingColumns 
        : this.outgoingColumns
    );
    
    // Force change detection to update UI
    this.cdr.detectChanges();
  }

  downloadAttachment(fileUrl: string, fileName: string) {
    this.showNoAttachmentsMessage.set(false);

    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = getShortFileName(fileName);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(fileUrl);
    window.document.body.removeChild(a);
  }

  /**
   * Convert date string from DD/MM/YYYY or ISO format to Date object
   * This method helps handle dates correctly from different sources
   */
  formatDate(dateString: string | Date): Date | null {
    if (!dateString) return null;

    // Check if it's already a Date object
    if (dateString instanceof Date) return dateString;

    // Try parsing DD/MM/YYYY format
    if (typeof dateString === 'string' && dateString.includes('/')) {
      // Match format DD/MM/YYYY
      const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = dateString.match(regex);

      if (!match) return null;
      
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // Adjust for JS months (0-11)
      const year = parseInt(match[3], 10);
      
      const date = new Date(year, month, day);
      
      // Validate that the date is real (handles cases like 31/02/2023)
      if (date.getDate() === day && 
          date.getMonth() === month && 
          date.getFullYear() === year) {
        return date;
      }

      return null;
    }

    // Try parsing ISO or other formats
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (e) {
      console.error('Error processing date:', e);
      return null;
    }
  }

  /**
   * Handle field changes from form controls
   * @param field The field name to update
   * @param value The new value
   */
  onChange(field: string, value: "incoming-document" | "outgoing-document"): void {
    try {
      const currentParams = this.searchParams();
      const updatedParams = { ...currentParams } as Record<string, any>;

      if (field !== 'documentType') {
        // Handle normal field updates
        updatedParams[field] = value || '';
        this.searchParams.set(updatedParams as SearchParams);
        
        // For debugging
        console.log(`Field ${field} updated to: ${value}`);
        console.log('Current search params:', this.searchParams());

        return;
      }

      // Ensure value is a string
      const docTypeValue = value;
        
      // Check if the value is actually different
      if (currentParams.documentType !== docTypeValue) {
        // Reset the form except for document type
        this.ngZone.run(() => {
          // First update the document type value
          updatedParams[field] = docTypeValue;
          this.searchParams.set(updatedParams as SearchParams);
          
          // Update displayed columns
          this.displayedColumns.set(
            docTypeValue === 'incoming-document' ? this.incomingColumns : this.outgoingColumns
          );
          
          // Reset all form fields except document type
          this.resetFormForDocumentTypeChange(docTypeValue);
          
          // Reset results table
          this.paginatedDocuments.set([]);
          this.filteredDocuments.set([]);
          this.hasSearched = false;
          
          // Reset pagination
          this.resetPageIndex()
          this.totalItems.set(0);
          
          // Update UI
          this.cdr.detectChanges();
        });
        
        return; // Exit early since we've handled everything
      }
    } catch (error) {
      console.error('Error updating field value:', error);
    }
  }
  
  /**
   * Reset form for document type change
   * Preserves document type while clearing other fields
   */
  private resetFormForDocumentTypeChange(documentType: "incoming-document" | "outgoing-document") {
    try {
      // Create a new form state with the preserved document type
      const newParams: SearchParams = {
        ...emptySearchForm,
        documentType: documentType
      };
      
      // Update the form data signal
      this.searchParams.set(newParams);
      
      // Reset all input components
      this.resetFormComponents();
      
      // Clear results but keep document type
      this.clearResults();
      
      // For debugging
      console.log('Form reset for document type change:', documentType);
    } catch (error) {
      console.error('Error during form reset for document type change:', error);
    }
  }

  /**
   * Xuất dữ liệu hiển thị ra file Excel
   */
  exportToExcel(): void {
    try {
      this.loading.set(true);
      this.exportService.processAndExportDataToExcel(this.filteredDocuments(), this.searchParams().documentType);
    } catch (error) {
      console.error('Lỗi khi xuất file Excel:', error);
    } finally {
      this.loading.set(false);
    }
  }
  
  /**
   * Xuất dữ liệu hiển thị ra file Word
   */
  exportToWord(): void {
    try {
      this.loading.set(true);
      this.exportService.processAndExportDataToWord(this.filteredDocuments(), this.searchParams());
    } catch (error) {
      console.error('Lỗi khi xuất file Word:', error);
    } finally {
      this.loading.set(false);
    }
  }
}
