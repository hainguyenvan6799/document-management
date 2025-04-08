import {
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { L10nTranslateAsyncPipe } from 'angular-l10n';
@Component({
  selector: 'cc-dropdown',
  standalone: true,
  imports: [
    L10nTranslateAsyncPipe,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: './cc-dropdown.component.html',
  styleUrl: './cc-dropdown.component.scss',
})
export class CcDropdownComponent {
  isDisabled: InputSignal<boolean> = input(false);
  listDropdown: InputSignal<any[]> = input([{ label: 'Select', value: null }]);
  valueChange: OutputEmitterRef<string> = output();
  label: InputSignal<string> = input('');
  value: InputSignal<string> = input('');
  errorMessage: InputSignal<string> = input('');
  selectedValue!: string;
  onChange(event: string) {
    this.valueChange.emit(event);
  }
}
