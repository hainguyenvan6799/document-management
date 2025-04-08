import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { L10nTranslateAsyncPipe } from 'angular-l10n';

@Component({
  selector: 'cc-input',
  imports: [
    L10nTranslateAsyncPipe,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './cc-input.component.html',
  styleUrl: './cc-input.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CcInputComponent {
  value: InputSignal<string> = input('');
  maxLength: InputSignal<number> = input(100);
  placeholder: InputSignal<string> = input('');
  name: InputSignal<string> = input('');
  type: InputSignal<string> = input('text');
  valueChange: OutputEmitterRef<any> = output<any>();
  require: InputSignal<boolean> = input(false);
  label: InputSignal<string> = input('abc');
  isDisabled: InputSignal<boolean> = input(false);
  regexStr = '^[0-9]+$';
  errorMessage: InputSignal<string> = input('');
  // @HostListener('document:keydown', ['$event']) onKeyDown(
  //   event: KeyboardEvent
  // ) {
  //   return new RegExp(this.regexStr).test(event.key);
  //   if (event.key !== 'Process') {
  //     console.log(new RegExp(this.regexStr).test(event.key), '1');
  //   }
  //   if (event.code.startsWith('Digit')) {
  //     console.log('here');
  //     return;
  //   }
  //   console.log('there');
  //   return;
  // }
  onValueChange(event: string) {
    this.valueChange.emit(event);
  }
}
