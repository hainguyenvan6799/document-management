import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'cc-mat-select',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
  ],
  template: `
    <mat-form-field [appearance]="appearance" class="w-100">
      <mat-label>{{ label }}</mat-label>
      <mat-select
        [(value)]="value"
        [formControl]="control"
        [multiple]="multiple"
        [placeholder]="placeholder"
        (selectionChange)="onSelectionChange($event)"
      >
        <mat-option *ngFor="let option of options" [value]="option.value">
          {{ option.label }}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .w-100 {
        width: 100%;
      }
    `,
  ],
})
export class CcMatSelectComponent {
  @Input() options: { label: string; value: any }[] = [];
  @Input() multiple = false;
  @Input() label = '';
  @Input() placeholder = '';
  @Input() appearance: 'fill' | 'outline' = 'outline';
  @Output() selectionChange = new EventEmitter<any>();
  @Input() value: string[] | undefined = [];
  control = new FormControl();

  onSelectionChange(event: any) {
    this.selectionChange.emit(event.value);
  }
}
