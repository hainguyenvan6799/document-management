import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
// import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  // animations: [
  //   trigger('menuAnimation', [
  //     transition(':enter', [
  //       style({ transform: 'translateY(-100%)' }),
  //       animate('200ms ease-out', style({ transform: 'translateY(0%)' })),
  //     ]),
  //     transition(':leave', [animate('200ms ease-in', style({ transform: 'translateY(-100%)' }))]),
  //   ]),
  // ],
})
export class HeaderComponent {
  private readonly router = inject(Router);
  constructor() {} // private voiceService: VoiceRecognitionService,
  // LIST_NAVBAR = LIST_NAVBAR;
  showInput: boolean = false;
  searchInput: string = '';
  isMenuOpen: boolean = false;
  isActive: boolean = false;
  index: number = 0;
  currentUrl: string = '';

  triggerShowInput(data: boolean) {
    if (this.searchInput) return;
    this.showInput = data;
  }
  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.url.slice(1);
      });
  }
  navigateTo(path: string) {
    this.router.navigate([path]);
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  // startRecord() {
  //   this.voiceService.start();
  // }
  // stopRecord() {
  //   this.voiceService.stop();
  // }
  search() {
    if (!this.searchInput) return;
  }
  setvalue(event: KeyboardEvent) {
    this.searchInput = (event.target as HTMLTextAreaElement).value;
  }
}
