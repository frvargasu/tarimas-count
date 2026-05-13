import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  template: `
    <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="viewBox">
      <circle
        [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
        fill="none" [attr.stroke]="trackColor" [attr.stroke-width]="strokeWidth"
      />
      <circle
        [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
        fill="none" [attr.stroke]="color" [attr.stroke-width]="strokeWidth"
        [attr.stroke-dasharray]="circumference"
        [attr.stroke-dashoffset]="dashoffset"
        stroke-linecap="round"
        [attr.transform]="rotateTransform"
      />
    </svg>
  `,
  styles: [':host { display: block; line-height: 0; }'],
})
export class ProgressRingComponent {
  @Input() porcentaje  = 0;
  @Input() color       = '#00E5A0';
  @Input() trackColor  = 'rgba(255,255,255,0.06)';
  @Input() size        = 160;
  @Input() strokeWidth = 14;

  get center(): number { return this.size / 2; }
  get radius(): number { return (this.size - this.strokeWidth) / 2; }
  get circumference(): number { return 2 * Math.PI * this.radius; }
  get dashoffset(): number {
    return this.circumference * (1 - Math.min(Math.max(this.porcentaje, 0), 100) / 100);
  }
  get viewBox(): string { return `0 0 ${this.size} ${this.size}`; }
  get rotateTransform(): string { return `rotate(-90 ${this.center} ${this.center})`; }
}
