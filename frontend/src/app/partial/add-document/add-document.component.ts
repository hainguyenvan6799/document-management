import {
  Component,
  computed,
  inject,
  Signal,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { MatLabel } from '@angular/material/form-field';
import { ActivatedRoute, Router } from '@angular/router';
import { L10nTranslateAsyncPipe } from 'angular-l10n';
import _ from 'lodash';
import { MessageService } from 'primeng/api';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { mergeMap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CcButtonComponent } from '../../commons/cc-button/cc-button.component';
import { CcDatePickerComponent } from '../../commons/cc-date-picker/cc-date-picker.component';
import { CcDropdownComponent } from '../../commons/cc-dropdown/cc-dropdown.component';
import { CcInputComponent } from '../../commons/cc-input/cc-input.component';
import { CcMatSelectComponent } from '../../commons/cc-mat-select/cc-mat-select.component';
import { DocumentService } from '../../services/document.service';
import { HttpClientService } from '../../services/http-client.service';
import { MESSAGE_CODES, MOVE_CV } from '../../share/constant';
import { ListUploadedComponent } from '../list-uploaded/list-uploaded.component';

export type Dropdown = { label: string; value: string | null }[];
@Component({
  selector: 'app-add-document',
  imports: [
    CcInputComponent,
    CcDatePickerComponent,
    MatLabel,
    CcButtonComponent,
    FileUploadModule,
    ToastModule,
    CcDropdownComponent,
    L10nTranslateAsyncPipe,
    ListUploadedComponent,
    CcMatSelectComponent,
  ],
  providers: [MessageService],
  templateUrl: './add-document.component.html',
  styleUrl: './add-document.component.scss',
})
export class AddDocumentComponent {
  protected messageService: MessageService = inject(MessageService);
  protected httpCientService: HttpClientService = inject(HttpClientService);
  protected documentService: DocumentService = inject(DocumentService);
  protected router: Router = inject(Router);
  protected route: ActivatedRoute = inject(ActivatedRoute);
  emptyBody = {
    receivedDate: '',
    issuedDate: '',
    referenceNumber: '',
    priority: '',
    type: '',
    author: '',
    summary: '',
    receivingMethod: '',
    dueDate: '',
    processingOpinion: '',
    attachments: '',
    internalRecipients: [],
  };
  body: WritableSignal<{
    documentNumber?: string;
    receivedDate: string;
    issuedDate: string;
    referenceNumber: string;
    priority: string;
    type: string;
    author: string;
    summary: string;
    receivingMethod: string;
    dueDate: string;
    processingOpinion: string;
    attachments: string;
    internalRecipients?: string[];
  }> = signal(this.emptyBody);
  error: WritableSignal<any> = signal({});
  dropdown: Signal<{
    documentType: Dropdown;
    priority: Dropdown;
    receivingMethod: Dropdown;
    internalRecipients: Dropdown;
  }> = signal({
    documentType: [
      { label: 'Báo cáo', value: 'report' },
      { label: 'Công văn', value: 'correspondence' },
      { label: 'Kế hoạch', value: 'plan' },
      { label: 'Thông báo', value: 'announcement' },
      { label: 'Quyết định', value: 'decision' },
    ],
    priority: [
      { label: 'Thường', value: 'normal' },
      { label: 'Khẩn', value: 'urgent' },
    ],
    receivingMethod: [
      { label: 'Giấy', value: 'letter' },
      { label: 'Điện tử', value: 'email' },
    ],
    internalRecipients: [
      { label: MOVE_CV.CBQL, value: 'management-staff' },
      { label: MOVE_CV.GIAO_VIEN, value: 'teacher' },
      { label: MOVE_CV.NHAN_VIEN, value: 'staff' },
    ],
  });
  upload: Signal<FileUpload> = viewChild.required('fu');
  files: WritableSignal<File[]> = signal([]);
  id = computed(() => this.route.snapshot.paramMap.get('id'));
  isEditDocument = computed(() => this.id() !== null);
  documentTitle: Signal<string> = computed(() =>
    this.isEditDocument() ? 'Sửa' : 'Tạo'
  );
  ngOnInit() {
    this.getDocument()?.subscribe({
      next: (data: any) => {
        this.body.set(data.document);
      },
    });
  }

  onChange(key: string, value: any) {
    this.body.update((prev) => {
      const old = _.cloneDeep(prev);
      if (key === 'internalRecipients') {
        _.set(old, [key], value.value);
      } else {
        _.set(old, [key], value);
      }
      return old;
    });
  }
  save$() {
    if (this.isEditDocument()) {
      console.log(this.isEditDocument(), this.id());
      return this.patchDocument$()
        .pipe(
          mergeMap((data: any) => {
            if (data.message === MESSAGE_CODES.VALIDATION_FAILED) {
              this.error.set(data.errors);
              return of(null);
            }
            this.documentService.currentAdd.set(data.document.id);
            const docNumber = data.document.documentNumber;
            if (!docNumber) return of(null);
            return this.patchFile$(data.document.documentNumber);
          })
        )
        .subscribe({
          next: (data) => {
            if (!data) return;
            this.body.set(this.emptyBody);
            this.error.set({});
            this.router.navigateByUrl('');
          },
        });
    }
    return this.saveDocument$()
      .pipe(
        mergeMap((data: any) => {
          if (data.message === MESSAGE_CODES.VALIDATION_FAILED) {
            this.error.set(data.errors);
            return of(null);
          }
          this.documentService.currentAdd.set(data.document.id);
          const docNumber = data.document.documentNumber;
          if (!docNumber) return of(null);
          return this.patchFile$(data.document.documentNumber);
        })
      )
      .subscribe({
        next: (data) => {
          if (!data) return;
          this.body.set(this.emptyBody);
          this.error.set({});
          this.router.navigateByUrl('');
        },
      });
  }
  onUpload(event: any) {
    this.files.set(event.currentFiles);
  }
  onRemove() {
    this.files.set([]);
  }
  cancel() {
    this.router.navigate(['../']);
  }
  patchDocument$() {
    return this.httpCientService.commonPatch({
      url: `${environment.RESOURCE_URL}/incoming-documents/${
        this.body().documentNumber
      }`,
      body: {
        ...this.body(),
        status: 'finished',
      },
    });
  }
  saveDocument$() {
    return this.httpCientService.comonPost({
      url: `${environment.RESOURCE_URL}/incoming-documents`,
      body: _.omit(this.body(), 'attachments'),
    });
  }
  getDocument() {
    if (!this.id()) return;
    return this.documentService.getDocument$({
      documentNumber: this.id() as string,
    });
  }

  patchFile$(documentId: string) {
    const body = new FormData();
    if (!this.files().length) return of(this.body().attachments);
    for (const file of this.files()) {
      body.append('attachments', file);
    }
    return this.httpCientService.commonPatch({
      url: `${environment.RESOURCE_URL}/incoming-documents/${documentId}`,
      body,
    });
  }
}
