import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { firstValueFrom, Subscription } from 'rxjs';

import { StorageService } from '../../core/services/storage.service';
import { ApiService }     from '../../core/services/api.service';
import { DbService }      from '../../core/services/db.service';
import { SyncService }    from '../../core/services/sync.service';
import {
  Turno, Actividad, MetricasActividad, RegistroLocal, UsuarioInfo,
  METAS, HORARIOS_TURNO,
} from '../../core/models';
import { TripleRingComponent }     from '../../shared/components/progress-ring/progress-ring.component';
import { RegistroModalComponent }  from '../../shared/components/registro-modal/registro-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent, AsyncPipe, TripleRingComponent],
})
export class HomePage implements OnInit, OnDestroy {
  private readonly storage   = inject(StorageService);
  private readonly api       = inject(ApiService);
  private readonly db        = inject(DbService);
  private readonly sync      = inject(SyncService);
  private readonly router    = inject(Router);
  private readonly modalCtrl = inject(ModalController);

  readonly isOffline$ = this.sync.isOffline$;
  readonly turnos: Turno[] = ['Mañana', 'Tarde', 'Noche', 'Noche Domingo'];

  usuario:        UsuarioInfo | null = null;
  turnoActivo:    Turno              = 'Mañana';
  horaActual      = '';
  fechaHoy        = '';
  metricas:       { carga: MetricasActividad; hauler: MetricasActividad } | null = null;
  registrosHoy:   RegistroLocal[]    = [];
  pendientes      = 0;
  cargando        = true;
  isOfflineActual = false;

  private clockTimer:  ReturnType<typeof setInterval> | null = null;
  private offlineSub?: Subscription;

  get pctOperativa(): number {
    if (!this.metricas) return 0;
    const totalActual   = this.metricas.carga.totalActual + this.metricas.hauler.totalActual;
    const metaOperativa = this.metricas.carga.meta;
    return metaOperativa > 0 ? Math.round((totalActual / metaOperativa) * 100) : 0;
  }

  get totalActualHoy(): number {
    return (this.metricas?.carga.totalActual ?? 0) + (this.metricas?.hauler.totalActual ?? 0);
  }

  get totalMetaHoy(): number {
    return this.metricas?.carga.meta ?? 0;
  }

  get totalHaulerHoy(): number {
    return this.metricas?.hauler.totalActual ?? 0;
  }

  get pctHaulerVisual(): number {
    if (!this.metricas) return 0;
    const meta = this.metricas.carga.meta;
    return meta > 0
      ? Math.min(Math.round((this.metricas.hauler.totalActual / meta) * 100), 100)
      : 0;
  }

  get turnoInfo(): string {
    const h = HORARIOS_TURNO[this.turnoActivo];
    return `${this.turnoActivo} · ${h.conexion} – ${h.desconexion}`;
  }

  get fechaDisplay(): string {
    const hoy   = new Date();
    const meses = ['Ene','Feb','Mar','Abr','May','Jun',
                   'Jul','Ago','Sep','Oct','Nov','Dic'];
    return `Hoy ${hoy.getDate()} ${meses[hoy.getMonth()]}`;
  }

  ngOnInit(): void {
    this.usuario     = this.storage.getUsuario();
    this.turnoActivo = this.storage.getTurnoActivo();
    this.fechaHoy    = this.localDateStr(new Date());

    this.sync.iniciarListener();
    this.offlineSub  = this.sync.isOffline$.subscribe((v) => { this.isOfflineActual = v; });

    this.actualizarHora();
    this.clockTimer = setInterval(() => this.actualizarHora(), 60_000);
    void this.cargarDatos();
  }

  ngOnDestroy(): void {
    if (this.clockTimer !== null) clearInterval(this.clockTimer);
    this.offlineSub?.unsubscribe();
  }

  async cambiarTurno(turno: Turno): Promise<void> {
    this.turnoActivo = turno;
    this.storage.setTurnoActivo(turno);
    await this.cargarDatos();
  }

  logout(): void {
    this.storage.clear();
    void this.router.navigate(['/login']);
  }

  irASemana(): void {
    void this.router.navigate(['/semana']);
  }

  irAPerfil(): void {
    void this.router.navigate(['/perfil']);
  }

  async abrirModalRegistro(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component:         RegistroModalComponent,
      componentProps:    {
        turnoActivo:    this.turnoActivo,
        metricasCarga:  this.metricas?.carga  ?? null,
        metricasHauler: this.metricas?.hauler ?? null,
        isOffline:      this.isOfflineActual,
      },
      breakpoints:       [0, 0.9, 1],
      initialBreakpoint: 0.9,
      cssClass:          'registro-modal',
    });

    await modal.present();

    const { data } = await modal.onDidDismiss<{ registrado: boolean }>();
    if (data?.registrado) {
      await this.cargarDatos();
    }
  }

  abrirModalCarro(): void {
    // TODO: implementar modal de carro
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;
    if (!this.usuario) { void this.router.navigate(['/login']); return; }

    try {
      const res     = await firstValueFrom(this.api.obtenerHoy(this.fechaHoy, this.turnoActivo));
      this.metricas = res.metricas;
    } catch {
      const locales   = await this.db.obtenerPorFecha(this.fechaHoy, this.usuario.id);
      const filtrados = locales.filter((r) => r.turno === this.turnoActivo);
      this.metricas = {
        carga:  this.calcularMetricasLocal(filtrados, 'carga',  this.turnoActivo),
        hauler: this.calcularMetricasLocal(filtrados, 'hauler', this.turnoActivo),
      };
    }

    const todos = await this.db.obtenerPorFecha(this.fechaHoy, this.usuario.id);
    this.registrosHoy = todos
      .filter((r) => r.turno === this.turnoActivo)
      .reverse()
      .slice(0, 20);
    this.pendientes = await this.sync.contarPendientes(this.usuario.id);
    this.cargando   = false;
  }

  private actualizarHora(): void {
    const now = new Date();
    const h   = now.getHours().toString().padStart(2, '0');
    const m   = now.getMinutes().toString().padStart(2, '0');
    this.horaActual = `${h}:${m}`;
  }

  private localDateStr(d: Date): string {
    const y   = d.getFullYear();
    const mo  = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }

  private calcularMetricasLocal(
    registros: RegistroLocal[], actividad: Actividad, turno: Turno,
  ): MetricasActividad {
    const meta        = METAS[turno][actividad];
    const totalHoras  = HORARIOS_TURNO[turno].duracionProductiva;
    const filtrados   = registros.filter((r) => r.actividad === actividad);
    const totalActual = filtrados.reduce((s, r) => s + r.tarimas, 0);

    const now                = new Date();
    const horasTranscurridas = Math.max(now.getHours() + now.getMinutes() / 60, 0.5);
    const horasRestantes     = Math.max(totalHoras - horasTranscurridas, 0);

    const tarimasXHora   = totalActual / horasTranscurridas;
    const proyeccion     = Math.round(tarimasXHora * totalHoras);
    const ritmoRequerido = horasRestantes > 0
      ? (meta - totalActual) / horasRestantes
      : 0;
    const porcentaje = Math.min(Math.round((totalActual / meta) * 100), 100);
    const cumple     = totalActual >= meta;
    const estado: MetricasActividad['estado'] =
      cumple ? 'cumplido' : porcentaje >= 85 ? 'en meta' : 'bajo meta';

    return {
      actividad, totalActual, meta, porcentaje,
      tarimasXHora, ritmoRequerido, proyeccion, cumple, estado,
    };
  }
}
