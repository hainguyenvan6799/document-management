import {
  ChangeDetectorRef,
  Component,
  inject,
  input,
  InputSignal,
  output,
} from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'cc-radio-group',
  imports: [MatRadioModule],
  templateUrl: './cc-radio-group.component.html',
  styleUrl: './cc-radio-group.component.scss',
})
export class CcRadioGroupComponent {
  private cdr = inject(ChangeDetectorRef);

  readonly options = input<any[]>([]);

  disabled: InputSignal<boolean> = input(false);

  value: InputSignal<string> = input('');

  label: InputSignal<string> = input('');

  readonly stacking = input<'row' | 'column'>('column');

  error: InputSignal<string> = input('');

  /**Whether the label should appear after or before the radio. */
  readonly labelPosition = input<string>('after');

  /**Name attribute of the input element. */
  readonly name = input<string>();

  /**
   * This function will be called when the user chooses an option. The new value will be passed as a parameter.
   */
  readonly onChange = output<string>();

  checkedRecord: Record<string, boolean> = {};

  ngOnInit(): void {
    if (this.value) {
      this.checkedRecord[this.value()] = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.value) {
      this.checkedRecord[this.value()] = true;
    }
    this.cdr.detectChanges();
  }

  onChangeHandler(value: string) {
    this.onChange.emit(value);
  }

  onCheck(key: string) {
    Object.keys(this.checkedRecord).forEach(
      (key) => (this.checkedRecord[key] = false)
    );
    this.checkedRecord[key] = true;
    this.onChangeHandler(key);
  }
}
