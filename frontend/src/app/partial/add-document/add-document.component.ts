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
import { environment } from '../../../environments/environment';
import { CcButtonComponent } from '../../commons/cc-button/cc-button.component';
import { CcDatePickerComponent } from '../../commons/cc-date-picker/cc-date-picker.component';
import { CcDropdownComponent } from '../../commons/cc-dropdown/cc-dropdown.component';
import { CcInputComponent } from '../../commons/cc-input/cc-input.component';
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
    internalRecipient: '',
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
    internalRecipient?: string;
  }> = signal(this.emptyBody);
  error: WritableSignal<any> = signal({});
  dropdown: Signal<{
    documentType: Dropdown;
    priority: Dropdown;
    receivingMethod: Dropdown;
    internalRecipient: Dropdown;
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
    internalRecipient: [
      { label: MOVE_CV.CBQL, value: 'management-staff' },
      { label: MOVE_CV.GIAO_VIEN, value: 'teacher' },
      { label: MOVE_CV.NHAN_VIEN, value: 'staff' },
    ],
  });
  upload: Signal<FileUpload> = viewChild.required('fu');
  files: WritableSignal<File[]> = signal([]);
  id = computed(() => this.route.snapshot.paramMap.get('id'));
  isEditDocument = computed(() => this.id());
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

  onChange(key: string, value: string) {
    this.body.update((prev) => {
      const old = _.cloneDeep(prev);
      _.set(old, [key], value);
      return old;
    });
  }
  save() {
    this.isEditDocument() ? this.patchDocument$() : this.saveDocument$();
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
    const body = new FormData();
    for (const file of this.files()) {
      if (!file) return;
      body.append('attachments', file);
    }

    const jsonBody: any = _.cloneDeep(this.body());
    for (const key in jsonBody) {
      if (jsonBody.hasOwnProperty(key)) {
        body.append(key, jsonBody[key]);
      }
    }
    body.set('status', 'finished');

    return this.httpCientService
      .commonPatch({
        url: `${environment.RESOURCE_URL}/incoming-documents/${
          this.body().documentNumber
        }`,
        body,
      })
      .subscribe({
        next: (data: any) => {
          if (data.message === MESSAGE_CODES.VALIDATION_FAILED) {
            this.error.set(data.errors);
            return;
          }
          this.documentService.currentAdd.set(data.document.id);
          this.body.set(this.emptyBody);
          this.error.set({});
          this.router.navigateByUrl('');
        },
        error: ({ error }) => {
          this.error.set(error.errors);
        },
      });
  }
  saveDocument$() {
    const body = new FormData();
    for (const file of this.files()) {
      if (!file) return;
      body.append('attachments', file);
    }

    const jsonBody: any = _.cloneDeep(this.body());
    for (const key in jsonBody) {
      if (jsonBody.hasOwnProperty(key)) {
        body.append(key, jsonBody[key]);
      }
    }
    return this.httpCientService
      .comonPost({
        url: `${environment.RESOURCE_URL}/incoming-documents`,
        body,
      })
      .subscribe({
        next: (data: any) => {
          if (data.message === MESSAGE_CODES.VALIDATION_FAILED) {
            this.error.set(data.errors);
            return;
          }
          this.body.set(this.emptyBody);
          this.error.set({});
          this.files.set([]);
          this.upload().clear();
          this.messageService.add({
            severity: 'success',
            summary: 'Success Message',
            detail: 'Thêm công văn thành công',
          });
        },
        error: ({ error }) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Something went wrong',
          });
          this.error.set(error.errors);
        },
      });
  }
  getDocument() {
    if (!this.id()) return;
    return this.documentService.getDocument$({
      documentNumber: this.id() as string,
    });
  }
}
