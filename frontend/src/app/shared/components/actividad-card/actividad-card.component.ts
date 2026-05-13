import { Component, Input } from '@angular/core';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { MetricasActividad } from '../../../core/models';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';

@Component({
  selector: 'app-actividad-card',
  templateUrl: './actividad-card.component.html',
  styleUrls: ['./actividad-card.component.scss'],
  imports: [ProgressRingComponent, DecimalPipe, UpperCasePipe],
})
export class ActividadCardComponent {
  @Input({ required: true }) data!: MetricasActividad;

  get ringColor(): string {
    if (this.data.estado === 'cumplido') return '#00E5A0';
    if (this.data.estado === 'en meta')  return '#FFB830';
    return '#FF4D6A';
  }

  get badgeClass(): string {
    const map: Record<string, string> = {
      'cumplido':  'badge-ok',
      'en meta':   'badge-warn',
      'bajo meta': 'badge-err',
    };
    return map[this.data.estado] ?? 'badge-err';
  }
}
