import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  input,
  InputSignal,
  output,
  Signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  provideNativeDateAdapter,
} from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerInputEvent,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {
  MatFormField,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { L10nTranslateAsyncPipe } from 'angular-l10n';
import moment from 'moment';
import {
  correctFormat,
  DATE_FORMAT,
  DateFormat,
  DEFAULT_DATE_FORMAT,
} from './date-format.class';
class StringUtil {
  public static trimString(value: string | undefined): string {
    return value?.trim() ?? '';
  }
}
export type FloatLabelType = 'always' | 'auto';

@Component({
  standalone: true,
  selector: 'cc-date-picker',
  templateUrl: './cc-date-picker.component.html',
  styleUrl: './cc-date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormField,
    MatLabel,
    // MatInput,
    MatDatepickerInput,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDatepickerToggle,
    // MatSuffix,
    MatDatepicker,
    MatInputModule,
    L10nTranslateAsyncPipe,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_FORMATS, useClass: DateFormat },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    // {
    //   provide: NG_VALUE_ACCESSOR,
    //   useExisting: CustomDatePickerComponent,
    //   multi: true,
    // },
  ],
})
export class CcDatePickerComponent {
  private readonly config = inject<DateFormat>(MAT_DATE_FORMATS);
  // private readonly translation = inject(TranslateService);
  readonly checkFutureDate = input<boolean>(false);

  value = input('', { transform: StringUtil.trimString });

  /**Initial value of the date input, only when it is uncontrolled. */
  readonly defaultValue = input<string | undefined>(undefined);

  /**Text to be placed above the date. */
  readonly label = input<string>('');

  /**Helper text to be placed above the date. */
  readonly helperText = input<string | undefined>(undefined);

  /**If true, the date format will appear as placeholder in the field. */
  readonly placeholder = input<boolean>(false);

  /**The format in which the date value will be displayed. User must use this format when editing the value or it will be considered as an invalid date. In this case, the onBlur and onChange events will be called with an internal error as a parameter reporting the situation. */
  format: InputSignal<DATE_FORMAT> = input(DEFAULT_DATE_FORMAT, {
    transform: correctFormat,
  });

  /**If true, the date will have an action to clear the entered value. */
  readonly clearable = input<boolean>(false);

  /**If true, the component will be disabled. */
  // TODO: Skipped for migration because:
  //  Accessor inputs cannot be migrated as they are too complex.
  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(state: boolean) {
    this._disabled = state;
    this.setDisable(state);
  }
  _disabled: boolean = false;

  /**If true, the date will be optional, showing (Optional) next to the label. Otherwise, the field will be considered required and an error will be passed as a parameter to the OnBlur and onChange events when it has not been filled. */
  readonly optional = input<boolean>(false);

  /**If true, the date will be required, showing (*) next to the label. */
  readonly required = input<boolean>(false);

  /**If it is defined, the component will change its appearance, showing the error below the date input component. If it is not defined, the error messages will be managed internally, but never displayed on its own. */
  readonly errorMessage = input<string | undefined>(undefined);

  /**Size of the margin to be applied to the component ('xxsmall' | 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'). You can pass an object with 'top', 'bottom', 'left' and 'right' properties in order to specify different margin sizes. *

  /**Size of the component ('medium' | 'large' | 'fillParent'). */
  readonly tabIndexValue = input<number>(0);

  /**HTML autocomplete attribute. Lets the user specify if any permission the user agent has to provide automated assistance in filling out the input value. Its value must be one of all the possible values of the HTML autocomplete attribute: 'on', 'off', 'email', 'username', 'new-password', ... */
  readonly autocomplete = input<string>('off');

  /**This event will emit in case the user types within the input element of the component. An object including the string value, the error and the date value will be emitted. An example of this object is: { value: value, error: error, date: date}. If the string value is a valid date, error will be undefined. Also, if the string value is not a valid date, date will be undefined. */
  readonly valueChange = output<any>();

  /**This event will emit in case the input element loses the focus. An object including the string value, the error and the date value will be emitted. An example of this object is: { value: value, error: error, date: date }. If the string value is a valid date, error will be undefined. Also, if the string value is not a valid date, date will be undefined. */
  readonly blur = output<any>();

  readonly floatLabel = input<FloatLabelType>('auto');

  public date: Signal<FormControl> = computed(
    () =>
      new FormControl(
        { value: this.valueFormat(), disabled: this.disabled },
        this.dateValidator(this.format())
      )
  );
  private readonly valueFormat: Signal<Date | ''> = computed(() => {
    if (!this.value()) {
      return '';
    }
    return moment(this.value(), this.format(), true).toDate();
  });

  public formatError: string = '';

  constructor() {
    this.config.format = computed(() => this.format());
  }

  onChangeDate(event: MatDatepickerInputEvent<Date>) {
    const formattedDate = event.value
      ? moment(event.value, true).format(this.format()).toString()
      : '';
    this.valueChange.emit(formattedDate);
    // this.onChange?.(formattedDate);
    this.writeValue?.(formattedDate);
  }

  dateValidator(format: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; // Don't validate empty values to allow required validator to handle them
      }
      const isValid = moment(value, format, true).isValid();
      return isValid ? null : { invalidDate: { value } };
    };
  }

  onBlur() {
    if (this.date().hasError('matDatepickerParse')) {
      this.formatError = 'Invalid Date Format';

      return;
    }
    this.formatError = '';
    // this.onTouched?.();
  }

  // onChange: (value: any) => void;
  // onTouched: () => void;

  writeValue(value: any): void {
    if (!value) {
      this.date().setValue('');
      return;
    }
    const date = moment(value, this.format(), true).toDate();
    this.date().setValue(date);
  }

  // registerOnChange(fn: any): void {
  //   this.onChange = fn;
  // }

  // registerOnTouched(fn: any): void {
  //   this.onTouched = fn;
  // }

  setDisabledState(isDisabled: boolean): void {
    this.setDisable(isDisabled);
  }

  setDisable(isDisabled: boolean) {
    if (isDisabled) this.date().disable();
    if (!isDisabled) this.date().enable();
  }
}
