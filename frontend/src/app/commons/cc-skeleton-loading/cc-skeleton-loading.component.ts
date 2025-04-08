import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'cc-skeleton-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cc-skeleton-loading.component.html',
  styleUrl: './cc-skeleton-loading.component.scss',
})
export class CcSkeletonLoadingComponent {
  @Input() width: string = '10rem';
  @Input() height: string = '2rem';
  @Input() borderRadius: string = '0';
}
