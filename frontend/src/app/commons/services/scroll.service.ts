import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {
  private scrollEvent = new Subject<Event>();
  scrollEvent$ = this.scrollEvent.asObservable();

  constructor() {
    this.init();
  }

  private init(): void {
    window.addEventListener('scroll', this.onScroll.bind(this), true);
  }
  private onScroll(event: Event): void {
    this.scrollEvent.next(event)
  }
  scrollToTop() {
    window.scroll(0, 0)
  }
  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll.bind(this), true);
  }
}
