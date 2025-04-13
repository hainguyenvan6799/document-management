import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CcMatSelectComponent } from '../../commons/cc-mat-select/cc-mat-select.component';
import { CommonModule } from '@angular/common';
import { CcButtonComponent } from '../../commons/cc-button/cc-button.component';

@Component({
  selector: 'app-transfer-dialog',
  imports: [CommonModule, CcMatSelectComponent, CcButtonComponent, ToastModule],
  providers: [MessageService],
  templateUrl: './transfer-dialog.component.html',
  styleUrl: './transfer-dialog.component.scss'
})
export class TransferDialogComponent {
  selectedRecipients: string[] = [];
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<TransferDialogComponent>,
    private messageService: MessageService
  ) {}
  
  onSelectionChange(event: any) {
    this.selectedRecipients = event;
  }
  
  cancel() {
    this.dialogRef.close();
  }
  
  confirm() {
    if (this.selectedRecipients.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng chọn người nhận',
      });
      return;
    }
    this.dialogRef.close({ selectedRecipients: this.selectedRecipients });
  }
}
