import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';

import { StorageService } from '../../core/services/storage.service';
import { ApiService }     from '../../core/services/api.service';
import { DbService }      from '../../core/services/db.service';
import {
  UsuarioInfo, Turno, ResumenDia, METAS, HORARIOS_TURNO,
} from '../../core/models';

type EstadoDia = 'cumplido' | 'parcial' | 'bajo' | 'libre' | 'sin_marcar' | 'vacio';

interface DiaCalendario {
  fecha:          string;
  diaSemana:      number;
  diaNumero:      number;
  esHoy:          boolean;
  esDelMes:       boolean;
  estado:         EstadoDia;
  totalCarga:     number;
  totalHauler:    number;
  totalOperativa: number;
  metaCarga:      number;
  turno?:         Turno;
  tieneDatos:     boolean;
}

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  standalone: true,
  imports: [IonContent],
})
export class PerfilPage implements OnInit {
  private readonly storage = inject(StorageService);
  private readonly api     = inject(ApiService);
  private readonly db      = inject(DbService);
  private readonly router  = inject(Router);

  usuario:             UsuarioInfo | null  = null;
  mesActual:           Date                = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  cargando             = true;
  tarimasMes           = 0;
  diasTrabajados       = 0;
  metasCumplidas       = 0;
  totalDiasTrabajables = 0;
  diasCalendario:      DiaCalendario[]     = [];
  diaSeleccionado:     DiaCalendario | null = null;

  private readonly MESES_NOMBRES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ];

  get nombreMes(): string {
    return `${this.MESES_NOMBRES[this.mesActual.getMonth()]} ${this.mesActual.getFullYear()}`;
  }

  get diasSemanaHeader(): string[] {
    return ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  }

  get turnoInfo(): string {
    if (!this.usuario) return '';
    const turno = this.usuario.turno_default;
    const h     = HORARIOS_TURNO[turno];
    return `${turno} · ${h.conexion} – ${h.desconexion}`;
  }

  get inicialUsuario(): string {
    return this.usuario?.username?.charAt(0)?.toUpperCase() ?? '?';
  }

  get puedeIrSiguiente(): boolean {
    const mesHoy = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    return this.mesActual < mesHoy;
  }

  get fechaDetalleLabel(): string {
    if (!this.diaSeleccionado) return '';
    const parts      = this.diaSeleccionado.fecha.split('-').map(Number);
    const y          = parts[0] ?? new Date().getFullYear();
    const m          = parts[1] ?? 1;
    const d          = parts[2] ?? 1;
    const diasNombre = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const fecha      = new Date(y, m - 1, d);
    return `${diasNombre[fecha.getDay()]} ${d} ${this.MESES_NOMBRES[m - 1] ?? ''}`;
  }

  ngOnInit(): void {
    this.usuario  = this.storage.getUsuario();
    this.mesActual = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    void this.cargarMes();
  }

  async cargarMes(): Promise<void> {
    this.cargando        = true;
    this.diaSeleccionado = null;
    const resumenMap     = new Map<string, ResumenDia>();

    try {
      const res = await firstValueFrom(this.api.obtenerSemana());
      for (const dia of res.resumen) {
        resumenMap.set(dia.fecha, dia);
      }
    } catch { /* sin datos de API — usa solo local */ }

    if (this.usuario) {
      const hoy     = this.localDateStr(new Date());
      const diasMes = this.getDiasDelMes();
      for (const fechaStr of diasMes) {
        if (fechaStr > hoy || resumenMap.has(fechaStr)) continue;
        const registros = await this.db.obtenerPorFecha(fechaStr, this.usuario.id);
        if (registros.length === 0) continue;

        const turno       = registros[0].turno;
        const totalCarga  = registros
          .filter((r) => r.actividad === 'carga')
          .reduce((s, r) => s + r.tarimas, 0);
        const totalHauler = registros
          .filter((r) => r.actividad === 'hauler')
          .reduce((s, r) => s + r.tarimas, 0);

        resumenMap.set(fechaStr, {
          fecha: fechaStr,
          turno,
          totalCarga,
          totalHauler,
          cumpleCarga:  totalCarga  >= METAS[turno]['carga'],
          cumpleHauler: totalHauler >= METAS[turno]['hauler'],
        });
      }
    }

    this.diasCalendario = this.construirCalendario(resumenMap);
    this.calcularStats();
    this.cargando = false;
  }

  mesAnterior(): void {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() - 1, 1);
    void this.cargarMes();
  }

  mesSiguiente(): void {
    if (!this.puedeIrSiguiente) return;
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + 1, 1);
    void this.cargarMes();
  }

  seleccionarDia(dia: DiaCalendario): void {
    if (!dia.esDelMes || dia.estado === 'vacio') return;
    this.diaSeleccionado = this.diaSeleccionado?.fecha === dia.fecha ? null : dia;
  }

  cerrarDetalle(): void {
    this.diaSeleccionado = null;
  }

  pctCargaDia(dia: DiaCalendario): number {
    return dia.metaCarga > 0
      ? Math.min(Math.round((dia.totalCarga / dia.metaCarga) * 100), 100)
      : 0;
  }

  pctHaulerDia(dia: DiaCalendario): number {
    return dia.metaCarga > 0
      ? Math.min(Math.round((dia.totalHauler / dia.metaCarga) * 100), 100)
      : 0;
  }

  logout(): void {
    this.storage.clear();
    void this.router.navigate(['/login']);
  }

  irAHome(): void   { void this.router.navigate(['/home']);   }
  irASemana(): void { void this.router.navigate(['/semana']); }

  private construirCalendario(resumenMap: Map<string, ResumenDia>): DiaCalendario[] {
    const hoy          = this.localDateStr(new Date());
    const year         = this.mesActual.getFullYear();
    const month        = this.mesActual.getMonth();
    const diasEnMes    = new Date(year, month + 1, 0).getDate();
    const primerDia    = new Date(year, month, 1);
    const offsetLunes  = (primerDia.getDay() + 6) % 7;
    const turnoDefault = this.usuario?.turno_default ?? 'Mañana';

    const dias: DiaCalendario[] = [];

    for (let i = 0; i < offsetLunes; i++) {
      const pad = new Date(year, month, 1 - (offsetLunes - i));
      dias.push(this.crearDiaVacio(pad));
    }

    for (let d = 1; d <= diasEnMes; d++) {
      const fecha    = new Date(year, month, d);
      const fechaStr = this.localDateStr(fecha);
      const esFuturo = fechaStr > hoy;
      const resumen  = resumenMap.get(fechaStr);

      let estado:         EstadoDia;
      let totalCarga      = 0;
      let totalHauler     = 0;
      let metaCarga       = 0;
      let turno:          Turno | undefined;

      if (esFuturo) {
        estado = 'vacio';
      } else if (resumen) {
        turno       = resumen.turno;
        totalCarga  = resumen.totalCarga;
        totalHauler = resumen.totalHauler;
        metaCarga   = METAS[turno]['carga'];
        const pct   = metaCarga > 0 ? (totalCarga / metaCarga) * 100 : 0;
        estado      = pct >= 100 ? 'cumplido' : pct >= 70 ? 'parcial' : pct > 0 ? 'bajo' : 'sin_marcar';
      } else {
        estado    = 'sin_marcar';
        metaCarga = METAS[turnoDefault]['carga'];
      }

      dias.push({
        fecha:          fechaStr,
        diaSemana:      (fecha.getDay() + 6) % 7,
        diaNumero:      d,
        esHoy:          fechaStr === hoy,
        esDelMes:       true,
        estado,
        totalCarga,
        totalHauler,
        totalOperativa: totalCarga + totalHauler,
        metaCarga,
        turno,
        tieneDatos:     totalCarga > 0 || totalHauler > 0,
      });
    }

    const totalCeldas = Math.ceil(dias.length / 7) * 7;
    let nextDay       = new Date(year, month + 1, 1);
    while (dias.length < totalCeldas) {
      dias.push(this.crearDiaVacio(nextDay));
      nextDay = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate() + 1);
    }

    return dias;
  }

  private crearDiaVacio(fecha: Date): DiaCalendario {
    return {
      fecha:          this.localDateStr(fecha),
      diaSemana:      (fecha.getDay() + 6) % 7,
      diaNumero:      fecha.getDate(),
      esHoy:          false,
      esDelMes:       false,
      estado:         'vacio',
      totalCarga:     0,
      totalHauler:    0,
      totalOperativa: 0,
      metaCarga:      0,
      tieneDatos:     false,
    };
  }

  private calcularStats(): void {
    const trabajados         = this.diasCalendario.filter((d) => d.esDelMes && d.tieneDatos);
    this.tarimasMes          = trabajados.reduce((s, d) => s + d.totalOperativa, 0);
    this.diasTrabajados      = trabajados.length;
    this.metasCumplidas      = trabajados.filter((d) => d.estado === 'cumplido').length;
    this.totalDiasTrabajables = trabajados.length;
  }

  private getDiasDelMes(): string[] {
    const year  = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) =>
      this.localDateStr(new Date(year, month, i + 1))
    );
  }

  private localDateStr(d: Date): string {
    const y   = d.getFullYear();
    const mo  = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
  }
}
