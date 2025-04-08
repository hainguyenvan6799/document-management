import {
  ChangeDetectionStrategy,
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { L10nTranslateAsyncPipe } from 'angular-l10n';

@Component({
  selector: 'cc-toggle-group',
  imports: [MatButtonToggleModule, L10nTranslateAsyncPipe],
  templateUrl: './cc-toggle-group.component.html',
  styleUrl: './cc-toggle-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CcToggleGroupComponent {
  readonly activeClass: InputSignal<boolean> = input<boolean>(false);
  listToggle: any = input([]);
  value: InputSignal<string> = input('');
  valueChange: OutputEmitterRef<string> = output();
  onChangeValue(event: MatButtonToggleChange) {
    this.valueChange.emit(event.value);
  }
}
