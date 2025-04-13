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
import { CcDatePickerComponent } from '../../commons/cc-date-picker/cc-date-picker.component';
import { CcDropdownComponent } from '../../commons/cc-dropdown/cc-dropdown.component';
import { CcInputComponent } from '../../commons/cc-input/cc-input.component';
import { CcMatSelectComponent } from '../../commons/cc-mat-select/cc-mat-select.component';
import { DocumentService } from '../../services/document.service';
import { HttpClientService } from '../../services/http-client.service';
import { MESSAGE_CODES, MOVE_CV } from '../../share/constant';
import { Dropdown } from '../add-document/add-document.component';
import { MatIconModule } from '@angular/material/icon';
import { getShortFileName } from '../../utils';
@Component({
  selector: 'app-add-outgoing-document',
  imports: [
    CcInputComponent,
    CcDatePickerComponent,
    MatLabel,
    FileUploadModule,
    ToastModule,
    CcDropdownComponent,
    L10nTranslateAsyncPipe,
    CcMatSelectComponent,
    MatIconModule,
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
    internalRecipients: [],
    status: 'waiting',
    filesToDelete: [],
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
    internalRecipients?: string[];
    filesToDelete?: string[];
  }> = signal(this.emptyBody);
  error: WritableSignal<any> = signal({});
  dropdown: Signal<{
    documentType: Dropdown;
    priority: Dropdown;
    signedBy: Dropdown;
    internalRecipients: Dropdown;
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
    internalRecipients: [
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
  filesToDelete: WritableSignal<string[]> = signal([]);
  id = computed(() => this.route.snapshot.paramMap.get('id'));
  isEditDocument = computed(() => this.id() !== null);
  documentTitle: Signal<string> = computed(() =>
    this.isEditDocument() ? 'Sửa' : 'Tạo'
  );
  ngOnInit() {
    this.getDocument()?.subscribe({
      next: async (data: any) => {
        this.body.set(data.document);

        if (!this.isEditDocument()) return;
        const files = await Promise.all(data.document.attachments.map((fileName: any) => {
          return new Promise((resolve, reject) => {
            this.documentService.downloadAttachment$(fileName, 'outgoing-document').subscribe({
              next: (response: any) => {
                const file = new File([response], fileName, { type: response.type });
                (file as any).displayFileName = getShortFileName(fileName);
                resolve(file);
              },
              error: () => {
                resolve(null);
              }
            });
          });
        }));
        const filteredFiles = files.filter((file) => file !== null);
        this.files.set(filteredFiles);
      },
    });
  }

  onChange(key: string, value: any) {
    this.body.update((prev) => {
      const old = _.cloneDeep(prev);
      if (key === 'internalRecipients') {
        _.set(old, [key], [value.value]);
      } else {
        _.set(old, [key], value);
      }
      return old;
    });
  }
  save$() {
    if (this.isEditDocument()) {
      return this.patchDocument$()
        ?.subscribe({
          next: (data: any) => {
            if (!data) return;
            this.documentService.currentAdd.set(data.document.id);
            this.body.set(this.emptyBody);
            this.error.set({});
            this.router.navigateByUrl('');
          },
        });
    }
    return this.saveDocument$()
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
    body.set('filesToDelete', this.filesToDelete().length === 0 ? '' : this.filesToDelete().join(', '));

    return this.httpCientService.commonPatch({
      url: `${environment.RESOURCE_URL}/outgoing-documents/${this.body().documentNumber}`,
      body,
    });
  }
  saveDocument$() {
    return this.httpCientService.comonPost({
      url: `${environment.RESOURCE_URL}/outgoing-documents`,
      body: _.omit(this.body(), 'attachments'),
    });
  }
  getDocument() {
    if (!this.id()) return;
    return this.documentService.getDocument$({
      documentNumber: this.id() as string,
    });
  }

  getShortFileName(fileName: string) {
    return getShortFileName(fileName);
  }

  removeFile(file: File, uploader: FileUpload) {
    this.filesToDelete.set([...this.filesToDelete(), file.name]);
    const currentIndex = uploader.files.indexOf(file);
    uploader.removeUploadedFile(currentIndex);
    const newFiles = uploader.files.filter((f, index) => index !== currentIndex);
    this.files.set(newFiles);
  }
}
