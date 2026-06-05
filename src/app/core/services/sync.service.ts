import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Network } from '@capacitor/network';
import { ApiService } from './api.service';
import { DbService } from './db.service';
import { StorageService } from './storage.service';
import { RegistroPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly api     = inject(ApiService);
  private readonly db      = inject(DbService);
  private readonly storage = inject(StorageService);

  private readonly offlineSubject = new BehaviorSubject<boolean>(false);
  readonly isOffline$: Observable<boolean> = this.offlineSubject.asObservable();

  private listenerActive = false;

  iniciarListener(): void {
    if (this.listenerActive) return;
    this.listenerActive = true;
    void this.init();
  }

  private async init(): Promise<void> {
    const status = await Network.getStatus();
    this.offlineSubject.next(!status.connected);

    await Network.addListener('networkStatusChange', async (networkStatus) => {
      const wasOffline = this.offlineSubject.value;
      this.offlineSubject.next(!networkStatus.connected);

      if (wasOffline && networkStatus.connected) {
        await this.sincronizarPendientes();
      }
    });
  }

  async sincronizarPendientes(): Promise<{ sincronizados: number }> {
    const usuario = this.storage.getUsuario();
    if (!usuario) return { sincronizados: 0 };

    const pendientes = await this.db.obtenerPendientes(usuario.id);
    if (pendientes.length === 0) return { sincronizados: 0 };

    const payloads: RegistroPayload[] = pendientes.map((r) => ({
      uuid:       r.uuid,
      fecha:      r.fecha,
      turno:      r.turno,
      actividad:  r.actividad,
      tarimas:    r.tarimas,
      hora:       r.hora,
    }));

    try {
      const result = await firstValueFrom(this.api.sincronizarLote(payloads));
      for (const p of payloads) {
        await this.db.marcarSincronizado(p.uuid);
      }
      return { sincronizados: result.insertados };
    } catch {
      return { sincronizados: 0 };
    }
  }

  contarPendientes(usuario_id: number): Promise<number> {
    return this.db.obtenerPendientes(usuario_id).then((r) => r.length);
  }
}
