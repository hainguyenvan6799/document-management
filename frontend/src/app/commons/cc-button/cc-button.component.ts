import { Component, input, InputSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { L10nTranslateAsyncPipe } from 'angular-l10n';

interface ButtonProperties {
  mode: 'primary' | 'secondary' | 'text';
}
@Component({
  selector: 'cc-button',
  standalone: true,
  imports: [L10nTranslateAsyncPipe, FormsModule],
  templateUrl: './cc-button.component.html',
  styleUrl: './cc-button.component.scss',
})
export class CcButtonComponent {
  src: InputSignal<string> = input('');
  title: InputSignal<string> = input('');
  onClick = output<any>();
  preffix: InputSignal<boolean> = input(false);
  mode: InputSignal<ButtonProperties['mode']> = input<
    'primary' | 'secondary' | 'text'
  >('primary');
}
