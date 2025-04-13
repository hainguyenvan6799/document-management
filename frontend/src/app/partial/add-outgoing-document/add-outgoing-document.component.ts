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
import { MatIconModule } from '@angular/material/icon';
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
import { getShortFileName } from '../../utils';
import { Dropdown } from '../add-document/add-document.component';
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
    CcButtonComponent,
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
        const files = await Promise.all(
          data.document.attachments.map((fileName: any) => {
            return new Promise((resolve, reject) => {
              this.documentService
                .downloadAttachment$(fileName, 'outgoing-document')
                .subscribe({
                  next: (response: any) => {
                    const file = new File([response], fileName, {
                      type: response.type,
                    });
                    (file as any).displayFileName = getShortFileName(fileName);
                    resolve(file);
                  },
                  error: () => {
                    const nonExistentFile = new File([], fileName);
                    (nonExistentFile as any).isExistent = false;
                    resolve(nonExistentFile);
                  },
                });
            });
          })
        );
        const filteredFiles = files.filter((file) => file !== null);
        this.files.set(filteredFiles);
      },
    });
  }

  onChange(key: string, value: any) {
    this.body.update((prev) => {
      const old = _.cloneDeep(prev);
      _.set(old, [key], value);
      return old;
    });
  }
  save$() {
    if (this.isEditDocument()) {
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
            console.log({ data });
            if (!data) return;
            // if (this.filesToDelete().length > 0) {
            //   this.filesToDelete().forEach((file: string) => {
            //     this.deleteFiles$(file);
            //   });
            // }
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
          this.files.set([]);
          this.messageService.add({
            severity: 'success',
            summary: 'Success Message',
            detail: 'Thêm công văn thành công',
          });
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
    return this.httpCientService.commonPatch({
      url: `${environment.RESOURCE_URL}/outgoing-documents/${
        this.body().documentNumber
      }`,
      body: {
        ...this.body(),
        status: 'finished',
        filesToDelete: this.filesToDelete(),
      },
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
      isIncoming: false,
    });
  }

  patchFile$(documentId: string) {
    const body = new FormData();
    if (!this.files().length) return of(this.body().attachments);
    for (const file of this.files()) {
      if (!file || (file as any).isExistent === false) continue;
      body.append('attachments', file);
    }
    return this.httpCientService.commonPatch({
      url: `${environment.RESOURCE_URL}/outgoing-documents/${documentId}`,
      body,
    });
  }
  deleteFiles$(filename: string) {
    return this.documentService
      .deleteFile$({
        documentNumber: this.body().documentNumber as string,
        filename,
      })
      .subscribe();
  }
  getShortFileName(fileName: string) {
    const file = this.files().find((file) => file.name === fileName);
    if (!file || (file as any).isExistent === false)
      return (
        getShortFileName(fileName) + ' (Không tìm thấy file trong hệ thống)'
      );
    return getShortFileName(fileName);
  }

  removeFile(file: File, uploader: FileUpload) {
    this.filesToDelete.set([...this.filesToDelete(), file.name]);
    const currentIndex = uploader.files.indexOf(file);
    uploader.removeUploadedFile(currentIndex);
    const newFiles = uploader.files.filter(
      (f, index) => index !== currentIndex
    );
    this.files.set(newFiles);
  }
}
