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
import { Dropdown } from '../add-document/add-document.component';
import { ListUploadedComponent } from '../list-uploaded/list-uploaded.component';
@Component({
  selector: 'app-add-outgoing-document',
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
  templateUrl: './add-outgoing-document.component.html',
  styleUrl: './add-outgoing-document.component.scss',
})
export class AddOutgoingDocumentComponent {
  protected messageService: MessageService = inject(MessageService);
  protected httpCientService: HttpClientService = inject(HttpClientService);
  protected router: Router = inject(Router);
  protected documentService = inject(DocumentService);
  protected route: ActivatedRoute = inject(ActivatedRoute);
  emptyBody = {
    issuedDate: '',
    referenceNumber: '',
    priority: '',
    type: '',
    author: '',
    summary: '',
    signedBy: '',
    signerPosition: '',
    attachments: '',
    internalRecipient: '',
    status: 'waiting',
  };
  body: WritableSignal<{
    documentNumber?: string;
    issuedDate: string;
    referenceNumber: string;
    priority: string;
    type: string;
    author: string;
    summary: string;
    signedBy: string;
    signerPosition: string;
    attachments: string;
    internalRecipient?: string;
  }> = signal(this.emptyBody);
  error: WritableSignal<any> = signal({});
  dropdown: Signal<{
    documentType: Dropdown;
    priority: Dropdown;
    signedBy: Dropdown;
    internalRecipient: Dropdown;
    signerPosition: Dropdown;
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
    signedBy: [
      { label: 'Nguyễn Kim Đào', value: 'Nguyễn Kim Đào' },
      { label: 'Phạm Vĩnh Phú', value: 'Phạm Vĩnh Phú' },
      { label: 'Nguyễn Văn Nam', value: 'Nguyễn Văn Nam' },
    ],
    internalRecipient: [
      { label: MOVE_CV.CBQL, value: 'management-staff' },
      { label: MOVE_CV.GIAO_VIEN, value: 'teacher' },
      { label: MOVE_CV.NHAN_VIEN, value: 'staff' },
    ],
    signerPosition: [
      { label: 'Hiệu trưởng', value: 'Hiệu trưởng' },
      { label: 'Phó Hiệu trưởng', value: 'Phó Hiệu trưởng' },
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
    this.router.navigate(['']);
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
        url: `${environment.RESOURCE_URL}/outgoing-documents/${
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
          this.router.navigate([''], {
            queryParams: {
              documentType: 'outgoing',
              updated: true,
            },
          });
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
        url: `${environment.RESOURCE_URL}/outgoing-documents`,
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
            summary: 'Thành công',
            detail: 'Thêm công văn thành công',
          });
        },
        error: ({ error }) => {
          this.messageService.add({
            severity: 'error',
            detail: 'Có lỗi xảy ra',
          });
          this.error.set(error.errors);
        },
      });
  }
  getDocument() {
    if (!this.id()) return;
    return this.documentService.getDocument$({
      documentNumber: this.id() as string,
      isIncoming: false,
    });
  }
}
