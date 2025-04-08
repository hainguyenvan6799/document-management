import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  inject,
  Input,
  output,
  OutputEmitterRef,
  TemplateRef,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { L10nTranslateAsyncPipe } from 'angular-l10n';

export enum TEMPLATE_TYPE {
  TABLE_VIEW = 'table-view',
  LITE = 'lite',
}

@Component({
  selector: 'cc-dialog',
  imports: [
    MatDialogContent,
    NgClass,
    L10nTranslateAsyncPipe,
    NgTemplateOutlet,
  ],
  templateUrl: './cc-dialog.component.html',
  styleUrl: './cc-dialog.component.scss',
})
export class CcDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  dialogRef = inject<MatDialogRef<CcDialogComponent>>(MatDialogRef);

  readonly TEMPLATE_TYPE = TEMPLATE_TYPE;

  title: string = '';
  templateType: TEMPLATE_TYPE = TEMPLATE_TYPE.TABLE_VIEW;
  @Input() tempDialog!: TemplateRef<any>;
  readonly onCloseDialog: OutputEmitterRef<any> = output();
  ngOnInit(): void {
    this.title = this.data?.title || this.title;
    this.templateType = this.data?.templateType || TEMPLATE_TYPE.TABLE_VIEW;
  }

  onClose(event: any) {
    this.onCloseDialog.emit(event);
  }
}
