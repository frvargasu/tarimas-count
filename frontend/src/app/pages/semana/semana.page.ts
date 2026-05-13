import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';

import { ApiService }     from '../../core/services/api.service';
import { DbService }      from '../../core/services/db.service';
import { StorageService } from '../../core/services/storage.service';
import { Turno, ResumenDia, METAS } from '../../core/models';

type EstadoDia = 'superado' | 'cumplido' | 'bajo meta' | 'libre';

interface DiaVista {
  fecha:       string;
  diaNombre:   string;
  diaNumero:   number;
  mesNombre:   string;
  esHoy:       boolean;
  esLibre:     boolean;
  turno?:      Turno;
  totalCarga:  number;
  totalHauler: number;
  metaCarga:   number;
  metaHauler:  number;
  pctCarga:    number;
  pctHauler:   number;
  estadoCarga:  EstadoDia;
  estadoHauler: EstadoDia;
  excesoCarga:  number;
  excesoHauler: number;
}

@Component({
  selector: 'app-semana',
  templateUrl: 'semana.page.html',
  styleUrls: ['semana.page.scss'],
  imports: [IonContent],
})
export class SemanaPage implements OnInit {
  private readonly api     = inject(ApiService);
  private readonly db      = inject(DbService);
  private readonly storage = inject(StorageService);
  private readonly router  = inject(Router);

  resumen:     ResumenDia[] = [];
  isLoading    = true;
  semanaActual = new Date();

  readonly MAX_BAR_HEIGHT = 80;

  private readonly DIAS_NOMBRES = ['LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  private readonly MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  private readonly ESTADO_LABEL: Record<EstadoDia, string> = {
    superado:   'SUPERADO ↑',
    cumplido:   'CUMPLIDO ✓',
    'bajo meta': 'BAJO META',
    libre:      'LIBRE',
  };

  ngOnInit(): void {
    void this.cargarDatos();
  }

  /* ── Week data ─────────────────────────────── */

  get diasSemana(): DiaVista[] {
    const lunes  = this.getMondayOf(this.semanaActual);
    const dias: DiaVista[] = [];

    for (let i = 0; i < 6; i++) {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      const fechaStr    = this.localDateStr(fecha);
      const resumenDia  = this.resumen.find((r) => r.fecha === fechaStr);

      if (resumenDia) {
        const metaCarga  = METAS[resumenDia.turno]['carga'];
        const metaHauler = METAS[resumenDia.turno]['hauler'];
        dias.push({
          fecha:       fechaStr,
          diaNombre:   this.DIAS_NOMBRES[i],
          diaNumero:   fecha.getDate(),
          mesNombre:   this.MESES[fecha.getMonth()],
          esHoy:       this.esDiaActual(fechaStr),
          esLibre:     false,
          turno:       resumenDia.turno,
          totalCarga:  resumenDia.totalCarga,
          totalHauler: resumenDia.totalHauler,
          metaCarga,
          metaHauler,
          pctCarga:    this.calcularPorcentaje(resumenDia.totalCarga,  metaCarga),
          pctHauler:   this.calcularPorcentaje(resumenDia.totalHauler, metaHauler),
          estadoCarga:  this.calcularEstado(resumenDia.totalCarga,  metaCarga),
          estadoHauler: this.calcularEstado(resumenDia.totalHauler, metaHauler),
          excesoCarga:  Math.max(0, resumenDia.totalCarga  - metaCarga),
          excesoHauler: Math.max(0, resumenDia.totalHauler - metaHauler),
        });
      } else {
        dias.push({
          fecha:       fechaStr,
          diaNombre:   this.DIAS_NOMBRES[i],
          diaNumero:   fecha.getDate(),
          mesNombre:   this.MESES[fecha.getMonth()],
          esHoy:       this.esDiaActual(fechaStr),
          esLibre:     true,
          totalCarga:  0,  totalHauler: 0,
          metaCarga:   135, metaHauler: 187,
          pctCarga:    0,  pctHauler:   0,
          estadoCarga:  'libre', estadoHauler: 'libre',
          excesoCarga:  0,  excesoHauler:  0,
        });
      }
    }
    return dias;
  }

  get totalTarimasSemana(): number {
    return this.diasSemana.reduce((s, d) => s + d.totalCarga + d.totalHauler, 0);
  }

  get diasTrabajados(): number {
    return this.diasSemana.filter((d) => !d.esLibre).length;
  }

  get metasCumplidas(): string {
    const trabajados = this.diasSemana.filter((d) => !d.esLibre);
    const cumplidos  = trabajados.filter(
      (d) => d.estadoCarga !== 'bajo meta' && d.estadoHauler !== 'bajo meta',
    );
    return `${cumplidos.length}/${trabajados.length}`;
  }

  get semanaRangoLabel(): string {
    const lunes  = this.getMondayOf(this.semanaActual);
    const sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    return `${lunes.getDate()}–${sabado.getDate()} ${this.MESES[lunes.getMonth()]}`;
  }

  get puedeIrSiguiente(): boolean {
    const sig = new Date(this.semanaActual);
    sig.setDate(sig.getDate() + 7);
    return this.getMondayOf(sig).getTime() <= this.getMondayOf(new Date()).getTime();
  }

  /* ── Chart helpers ─────────────────────────── */

  get maxValor(): number {
    const vals = this.diasSemana.reduce((acc: number[], d: DiaVista) => {
      return acc.concat([d.totalCarga, d.totalHauler, d.metaCarga, d.metaHauler]);
    }, []);
    return Math.max(...vals, 1);
  }

  get metaLineBottom(): number {
    const metaRef = this.diasSemana.find((d) => !d.esLibre)?.metaCarga ?? 135;
    return 20 + Math.round((metaRef / this.maxValor) * this.MAX_BAR_HEIGHT);
  }

  calcBarHeight(value: number): number {
    return Math.max(2, Math.round((value / this.maxValor) * this.MAX_BAR_HEIGHT));
  }

  /* ── Week navigation ───────────────────────── */

  semanaAnterior(): void {
    const prev = new Date(this.semanaActual);
    prev.setDate(prev.getDate() - 7);
    this.semanaActual = prev;
    void this.cargarDatos();
  }

  semanaSiguiente(): void {
    if (!this.puedeIrSiguiente) return;
    const sig = new Date(this.semanaActual);
    sig.setDate(sig.getDate() + 7);
    this.semanaActual = sig;
    void this.cargarDatos();
  }

  /* ── Data loading ──────────────────────────── */

  async cargarDatos(): Promise<void> {
    this.isLoading = true;
    try {
      const res    = await firstValueFrom(this.api.obtenerSemana());
      this.resumen = res.resumen;
    } catch {
      await this.cargarDesdeLocal();
    } finally {
      this.isLoading = false;
    }
  }

  private async cargarDesdeLocal(): Promise<void> {
    const usuario = this.storage.getUsuario();
    if (!usuario) return;

    const lunes     = this.getMondayOf(this.semanaActual);
    const resultado: ResumenDia[] = [];

    for (let i = 0; i < 6; i++) {
      const fecha     = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      const fechaStr  = this.localDateStr(fecha);
      const registros = await this.db.obtenerPorFecha(fechaStr, usuario.id);
      if (registros.length === 0) continue;

      const turno      = registros[0].turno;
      const totalCarga = registros
        .filter((r) => r.actividad === 'carga')
        .reduce((s, r) => s + r.tarimas, 0);
      const totalHauler = registros
        .filter((r) => r.actividad === 'hauler')
        .reduce((s, r) => s + r.tarimas, 0);

      resultado.push({
        fecha:        fechaStr,
        turno,
        totalCarga,
        totalHauler,
        cumpleCarga:  totalCarga  >= METAS[turno]['carga'],
        cumpleHauler: totalHauler >= METAS[turno]['hauler'],
      });
    }

    this.resumen = resultado;
  }

  /* ── Navigation ────────────────────────────── */

  irAHome(): void {
    void this.router.navigate(['/home']);
  }

  /* ── Utils ─────────────────────────────────── */

  esDiaActual(fecha: string): boolean {
    return fecha === this.localDateStr(new Date());
  }

  calcularPorcentaje(actual: number, meta: number): number {
    return Math.round((actual / meta) * 100);
  }

  calcularEstado(actual: number, meta: number): EstadoDia {
    if (actual === 0)          return 'libre';
    if (actual >= meta * 1.1) return 'superado';
    if (actual >= meta)       return 'cumplido';
    return 'bajo meta';
  }

  estadoLabel(estado: EstadoDia): string {
    return this.ESTADO_LABEL[estado];
  }

  badgeClass(estado: EstadoDia): string {
    const map: Record<EstadoDia, string> = {
      superado:   'badge-superado',
      cumplido:   'badge-cumplido',
      'bajo meta': 'badge-bajo',
      libre:      'badge-libre',
    };
    return `estado-badge ${map[estado]}`;
  }

  clamp100(v: number): number { return Math.min(v, 100); }

  private getMondayOf(date: Date): Date {
    const d    = new Date(date);
    const day  = d.getDay();                  // 0=Dom … 6=Sáb
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private localDateStr(d: Date): string {
    const y   = d.getFullYear();
    const mo  = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }
}
