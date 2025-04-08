import { CdkColumnDef } from '@angular/cdk/table';
import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  contentChild,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  signal,
  TemplateRef,
  WritableSignal,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { L10nTranslateAsyncPipe } from 'angular-l10n';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}
export interface Column {
  label: string;
  iconHeader?: {
    src: string;
    className?: string;
  };
  colspan?: string;
  defaultIcon?: boolean;
  style?: Record<string, any>;
  hideColumn?: boolean;
  fieldName?: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

@Component({
  selector: 'cc-table',
  imports: [
    MatTableModule,
  ],
  templateUrl: './cc-table.component.html',
  styleUrl: './cc-table.component.scss',
  providers: [CdkColumnDef],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CcTableComponent {
  columns: WritableSignal<string[]> = signal([
    'position',
    'name',
    'weight',
    'symbol',
  ]);
  // listData: InputSignal<any> = input<PeriodicElement[]>([]);
  listData = signal([
    { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
    { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
    { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
    { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
    // Add more rows as needed...
  ]);
  clickedRows = new Set<PeriodicElement>();
  textNowrap: InputSignal<boolean> = input(false);
  sortName: OutputEmitterRef<{ value: string }> = output();
  readonly customBody = input(false);
  readonly templateRef =
    contentChild.required<TemplateRef<any>>('dataTemplate');
  constructor() {
    effect(() => console.log(this.listData()));
    effect(() => console.log(this.columns()));
  }
  getTrack(label: string, index: number) {
    return `${label}-${index}`;
  }
  sortTable(fieldName: string) {
    this.sortName.emit({ value: fieldName });
  }
}
