import { Component, signal, WritableSignal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { L10nTranslationModule } from 'angular-l10n';
import { HeaderComponent } from './share/header/header.component';

@Component({
  selector: 'app-root',
  imports: [
    L10nTranslationModule,
    HeaderComponent,
    // HomeComponent,
    RouterOutlet,
    // FooterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  isLoading: WritableSignal<boolean> = signal(false);
  title = 'freelancer-fe';
}
