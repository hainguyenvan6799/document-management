import { CdkColumnDef } from '@angular/cdk/table';
import {
  Component,
  inject,
  Input,
  input,
  InputSignal,
  model,
  ModelSignal,
  signal,
  TemplateRef,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { CcButtonComponent } from '../../commons/cc-button/cc-button.component';
import {
  CcDialogComponent,
  TEMPLATE_TYPE,
} from '../../commons/cc-dialog/cc-dialog.component';
import { CommonService } from '../../commons/common.service';
import { DocumentService } from '../../services/document.service';
@Component({
  selector: 'app-list-uploaded',
  imports: [MatTableModule, MatLabel, MatIcon, CcButtonComponent],
  templateUrl: './list-uploaded.component.html',
  styleUrl: './list-uploaded.component.scss',
  providers: [CdkColumnDef],
})
export class ListUploadedComponent {
  protected documentService: DocumentService = inject(DocumentService);
  protected commonService: CommonService = inject(CommonService);
  protected router: Router = inject(Router);
  protected dialog: MatDialog = inject(MatDialog);
  listData: ModelSignal<any> = model();
  columns: InputSignal<string[]> = input(['Stt', 'Tên File']);
  body: InputSignal<any> = input({});
  deleteConfirm = viewChild.required<TemplateRef<any>>('deleteConfirm');
  fileName: WritableSignal<string> = signal('');
  @Input() documentType: 'incoming-document' | 'outgoing-document' =
    'incoming-document';
  downLoadFile(fileName: string) {
    this.documentService
      .downloadAttachment$(fileName, this.documentType)
      .subscribe({
        next: (blob: object) => {
          this.commonService.downloadFile({ blob, fileName });
        },
        error: () => {
          this.commonService.downloadFile({ blob: '' });
        },
      });
  }
  deleteFile(fileName: string) {
    this.fileName.set(fileName);
    const data = {
      title: 'Xác nhận xóa File',
      templateType: TEMPLATE_TYPE.LITE,
    };
    const dialogRef = this.dialog.open(CcDialogComponent, { data });
    dialogRef.componentInstance.tempDialog = this.deleteConfirm();
    return dialogRef;
  }
  deleteFileConfirm(result: boolean) {
    this.dialog.closeAll();
    if (!result) return;
    return this.documentService
      .deleteFile$({
        documentNumber: this.body().documentNumber as string,
        filename: this.fileName(),
        isIncoming: this.documentType === 'incoming-document',
      })
      .subscribe({
        next: (data: any) =>
          this.listData.update(() => {
            this.fileName.set('');
            return data.attachments;
          }),
      });
  }
}
