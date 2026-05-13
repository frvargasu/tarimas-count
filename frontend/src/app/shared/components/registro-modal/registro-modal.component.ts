import { Component, Input, inject } from '@angular/core';
import { IonSpinner, ModalController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';

import { ApiService }     from '../../../core/services/api.service';
import { DbService }      from '../../../core/services/db.service';
import { StorageService } from '../../../core/services/storage.service';
import {
  Turno, Actividad, MetricasActividad, RegistroPayload, METAS,
} from '../../../core/models';

@Component({
  selector: 'app-registro-modal',
  templateUrl: './registro-modal.component.html',
  styleUrls:  ['./registro-modal.component.scss'],
  imports: [IonSpinner],
})
export class RegistroModalComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly api       = inject(ApiService);
  private readonly db        = inject(DbService);
  private readonly storage   = inject(StorageService);

  @Input() turnoActivo:    Turno               = 'Tarde';
  @Input() metricasCarga:  MetricasActividad | null = null;
  @Input() metricasHauler: MetricasActividad | null = null;
  @Input() isOffline:      boolean             = false;

  actividadSeleccionada: Actividad | null = null;
  cantidadStr = '';
  isLoading   = false;
  errorMsg    = '';

  readonly numKeys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  get cantidad(): number { return parseInt(this.cantidadStr) || 0; }

  get puedeConfirmar(): boolean {
    return this.actividadSeleccionada !== null
      && this.cantidad > 0
      && this.cantidad <= 500;
  }

  get metaRestanteCarga(): number {
    if (this.metricasCarga) {
      return Math.max(0, this.metricasCarga.meta - this.metricasCarga.totalActual);
    }
    return METAS[this.turnoActivo]['carga'];
  }

  get metaRestanteHauler(): number {
    if (this.metricasHauler) {
      return Math.max(0, this.metricasHauler.meta - this.metricasHauler.totalActual);
    }
    return METAS[this.turnoActivo]['hauler'];
  }

  get confirmLabel(): string {
    if (!this.actividadSeleccionada) return 'SELECCIONA UNA ACTIVIDAD';
    return `+ AGREGAR ${this.actividadSeleccionada === 'carga' ? 'CARGA' : 'HAULER'}`;
  }

  seleccionarActividad(actividad: Actividad): void {
    this.actividadSeleccionada = actividad;
    this.errorMsg = '';
  }

  presionarTecla(tecla: string): void {
    if (!tecla || this.isLoading) return;
    if (this.cantidadStr.length >= 3) return;
    this.cantidadStr += tecla;
    this.errorMsg = '';
  }

  borrar(): void {
    this.cantidadStr = this.cantidadStr.slice(0, -1);
  }

  limpiar(): void {
    this.cantidadStr = '';
  }

  async confirmar(): Promise<void> {
    if (!this.puedeConfirmar || !this.actividadSeleccionada) return;

    const usuario = this.storage.getUsuario();
    if (!usuario) return;

    const now     = new Date();
    const payload: RegistroPayload = {
      uuid:      crypto.randomUUID(),
      fecha:     this.localDateStr(now),
      turno:     this.turnoActivo,
      actividad: this.actividadSeleccionada,
      tarimas:   this.cantidad,
      hora:      now.toISOString(),
    };

    this.isLoading = true;
    this.errorMsg  = '';

    let sincronizado = false;

    if (!this.isOffline) {
      try {
        await firstValueFrom(this.api.crearRegistro(payload));
        sincronizado = true;
      } catch {
        sincronizado = false;
      }
    }

    try {
      await this.db.agregarRegistro({ ...payload, sincronizado, usuario_id: usuario.id });
      await this.modalCtrl.dismiss({ registrado: true });
    } catch {
      this.isLoading = false;
      this.errorMsg  = 'Error al guardar. Intenta de nuevo.';
    }
  }

  async cerrar(): Promise<void> {
    await this.modalCtrl.dismiss({ registrado: false });
  }

  private localDateStr(d: Date): string {
    const y   = d.getFullYear();
    const mo  = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }
}
