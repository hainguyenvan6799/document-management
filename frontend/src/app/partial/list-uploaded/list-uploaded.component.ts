import { CdkColumnDef } from '@angular/cdk/table';
import {
  Component,
  inject,
  Input,
  input,
  InputSignal,
  model,
  ModelSignal,
} from '@angular/core';
import { MatLabel } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { CommonService } from '../../commons/common.service';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-list-uploaded',
  imports: [MatTableModule, MatLabel],
  templateUrl: './list-uploaded.component.html',
  styleUrl: './list-uploaded.component.scss',
  providers: [CdkColumnDef],
})
export class ListUploadedComponent {
  protected documentService: DocumentService = inject(DocumentService);
  protected commonService: CommonService = inject(CommonService);
  listData: ModelSignal<any> = model();
  columns: InputSignal<string[]> = input(['Stt', 'Tên File']);
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
}
