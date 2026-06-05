import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-triple-ring',
  standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size"
         [attr.viewBox]="'0 0 ' + size + ' ' + size">

      <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="r3"
        fill="none" stroke="rgba(250,53,89,0.12)"
        [attr.stroke-width]="sw"/>
      <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="r3"
        fill="none" stroke="#FA3559"
        [attr.stroke-width]="sw"
        [attr.stroke-dasharray]="circ3"
        [attr.stroke-dashoffset]="offset3"
        stroke-linecap="round"
        [attr.transform]="'rotate(-90 ' + cx + ' ' + cy + ')'"/>

      <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="r2"
        fill="none" stroke="rgba(146,232,42,0.12)"
        [attr.stroke-width]="sw"/>
      <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="r2"
        fill="none" stroke="#92E82A"
        [attr.stroke-width]="sw"
        [attr.stroke-dasharray]="circ2"
        [attr.stroke-dashoffset]="offset2"
        stroke-linecap="round"
        [attr.transform]="'rotate(-90 ' + cx + ' ' + cy + ')'"/>

      <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="r1"
        fill="none" stroke="rgba(48,213,200,0.12)"
        [attr.stroke-width]="sw"/>
      <circle [attr.cx]="cx" [attr.cy]="cy" [attr.r]="r1"
        fill="none" stroke="#30D5C8"
        [attr.stroke-width]="sw"
        [attr.stroke-dasharray]="circ1"
        [attr.stroke-dashoffset]="offset1"
        stroke-linecap="round"
        [attr.transform]="'rotate(-90 ' + cx + ' ' + cy + ')'"/>
    </svg>
  `,
  styles: [':host { display: block; line-height: 0; }'],
})
export class TripleRingComponent {
  @Input() pctCarga: number = 0;
  @Input() pctHauler: number = 0;
  @Input() pctOperativa: number = 0;
  @Input() size: number = 130;
  @Input() sw: number = 9;

  get cx(): number { return this.size / 2; }
  get cy(): number { return this.size / 2; }

  get r1(): number { return (this.size / 2) - this.sw * 3.5; }
  get r2(): number { return (this.size / 2) - this.sw * 2; }
  get r3(): number { return (this.size / 2) - this.sw * 0.5; }

  get circ1(): number { return 2 * Math.PI * this.r1; }
  get circ2(): number { return 2 * Math.PI * this.r2; }
  get circ3(): number { return 2 * Math.PI * this.r3; }

  get offset1(): number { return this.circ1 * (1 - Math.min(this.pctCarga / 100, 1)); }
  get offset2(): number { return this.circ2 * (1 - Math.min(this.pctHauler / 100, 1)); }
  get offset3(): number { return this.circ3 * (1 - Math.min(this.pctOperativa / 100, 1)); }
}
