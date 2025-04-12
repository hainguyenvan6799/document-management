import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  viewChild,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { L10nTranslateAsyncPipe } from 'angular-l10n';
import { MOVE_CV } from '../../constant';

@Component({
  selector: 'app-waiting-document',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    L10nTranslateAsyncPipe,
  ],
  templateUrl: './waiting-document.component.html',
})
export class WaitingDocumentComponent {
  protected router: Router = inject(Router);
  @Input() waitingDocuments: any[] = [];
  @Input() columns: string[] = [];
  @Input() currentPage = 0;
  @Input() pageSize = 10;
  @Input() totalItems = 0;

  @Output() pageChanged = new EventEmitter<PageEvent>();
  @Output() openDialog = new EventEmitter<void>();
  @Output() finishDocument = new EventEmitter<any>();
  MOVE_CV = MOVE_CV;
  chuyen = viewChild('chuyen');
  returnDocument(element: any) {
    this.router.navigate(['modify-document', element]);
  }

  onChange(event: string) {
    console.log(event);
  }
}
