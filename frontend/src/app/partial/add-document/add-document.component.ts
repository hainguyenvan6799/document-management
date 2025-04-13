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
import { getShortFileName } from '../../utils';
import { MatIconModule } from '@angular/material/icon';
import { CcButtonComponent } from '../../commons/cc-button/cc-button.component';
export type Dropdown = { label: string; value: string | null }[];
@Component({
  selector: 'app-add-document',
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
    CcButtonComponent,
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
    filesToDelete: [],
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
    filesToDelete?: string[];
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
        this.showCustomFileUpload(data);
      },
    });
  }

  private async showCustomFileUpload(data: any) {
    const files = await Promise.all(data.document.attachments.map((fileName: any) => {
      return new Promise((resolve) => {
        this.documentService.downloadAttachment$(fileName, 'incoming-document').subscribe({
          next: (response: any) => resolve(new File([response], fileName, { type: response.type })),
          error: () => {
            const nonExistentFile = new File([], fileName);
            (nonExistentFile as any).isExistent = false;
            resolve(nonExistentFile);
          } 
        });
      });
    }));
    this.files.set(files);
  }

  getShortFileName(fileName: string) {
    const file = this.files().find(file => file.name === fileName);
    if (!file || (file as any).isExistent === false) return getShortFileName(fileName) + ' (Không tìm thấy file trong hệ thống)';
    return getShortFileName(fileName);
  }

  removeFile(file: File, uploader: FileUpload) {
    // These files will be passed to the backend to delete
    this.filesToDelete.set([...this.filesToDelete(), file.name]);

    // Remove the file from the uploader
    const currentIndex = uploader.files.indexOf(file);
    uploader.removeUploadedFile(currentIndex);
    const newFiles = uploader.files.filter((f, index) => index !== currentIndex);
    this.files.set(newFiles);
  }

  onChange(key: string, value: unknown) {
    console.log(key, value);
    this.body.update((prev) => {
      const clonedPrev = _.cloneDeep(prev);
      _.set(clonedPrev, [key], value);
      return clonedPrev;
    });
  }

  save$() {
    return this.isEditDocument() ? this.saveToUpdate() : this.saveToCreate();
  }

  private saveToUpdate() {
    return this.patchDocument$()?.subscribe({
      next: (data: any) => {
        if (!data) return;
        this.documentService.currentAdd.set(data.document.id);
        this.body.set(this.emptyBody);
        this.error.set({});
        this.router.navigateByUrl('');
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: error.message });
      }
    });
  }

  private saveToCreate() {
    return this.saveDocument$()
    .subscribe({
      next: (data) => {
        if (!data) return;
        this.body.set(this.emptyBody);
        this.error.set({});
      },
    });
  }

  onUpload(event: any) {
    this.files.set(event.currentFiles);
  }

  onRemove() {
    this.files.set([]);
    this.filesToDelete.set([]);
  }

  cancel() {
    this.router.navigate(['../']);
  }

  patchDocument$() {
    const body = new FormData();
    for (const file of this.files()) {
      if (!file || (file as any).isExistent === false) continue;
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
      url: `${environment.RESOURCE_URL}/incoming-documents/${this.body().documentNumber}`,
      body,
    });
  }

  saveDocument$() {
    return this.httpCientService.comonPost({
      url: `${environment.RESOURCE_URL}/incoming-documents`,
      body: _.omit(this.body(), 'attachments'),
    });
  }

  getDocument() {
    const documentNumber = this.id();
    if (!documentNumber) return;
    return this.documentService.getDocument$({documentNumber});
  }
}
