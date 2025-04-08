import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'cc-wheel',
  standalone: true,
  imports: [],
  templateUrl: './cc-wheel.component.html',
  styleUrl: './cc-wheel.component.scss',
  animations: [
    trigger('spin', [
      state('spinning', style({ transform: 'rotate({{ rotation }}deg)' }), {
        params: { rotation: 0 },
      }),
      transition('void => spinning', animate('5s linear')),
    ]),
  ],
})
export class CcWheelComponent implements OnInit {
  prizes: string[] = ['Prize 1', 'Prize 2', 'Prize 3', 'Prize 4', 'Prize 5'];
  selectedPrize: string | undefined;
  spinning: boolean = false;
  rotation: number = 0;

  constructor() {}

  ngOnInit(): void {}

  spinWheel() {
    if (!this.spinning) {
      this.spinning = true;
      const randomRotation = Math.floor(Math.random() * 360) + 360 * 5; // 5 full rotations
      this.rotation = randomRotation;
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * this.prizes.length);
        this.selectedPrize = this.prizes[randomIndex];
        this.spinning = false;
      }, 5000); // 5 seconds for animation
    }
  }
}
