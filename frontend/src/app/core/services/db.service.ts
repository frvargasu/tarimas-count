import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import { RegistroLocal } from '../models';

class DespachoDatabase extends Dexie {
  registros!: Table<RegistroLocal, number>;

  constructor() {
    super('despacho_db');
    this.version(1).stores({
      registros: '++id, uuid, fecha, usuario_id, actividad, sincronizado',
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DbService {
  private readonly db = new DespachoDatabase();

  agregarRegistro(registro: Omit<RegistroLocal, 'id'>): Promise<number> {
    return this.db.registros.add(registro as RegistroLocal);
  }

  obtenerPendientes(usuario_id: number): Promise<RegistroLocal[]> {
    return this.db.registros
      .where('usuario_id')
      .equals(usuario_id)
      .filter((r) => !r.sincronizado)
      .toArray();
  }

  obtenerPorFecha(fecha: string, usuario_id: number): Promise<RegistroLocal[]> {
    return this.db.registros
      .where('usuario_id')
      .equals(usuario_id)
      .and((r) => r.fecha === fecha)
      .toArray();
  }

  async marcarSincronizado(uuid: string): Promise<void> {
    await this.db.registros.where('uuid').equals(uuid).modify({ sincronizado: true });
  }

  async limpiarSincronizados(usuario_id: number): Promise<void> {
    const corte = new Date();
    corte.setDate(corte.getDate() - 7);
    const limite = [
      corte.getFullYear(),
      String(corte.getMonth() + 1).padStart(2, '0'),
      String(corte.getDate()).padStart(2, '0'),
    ].join('-');

    await this.db.registros
      .where('usuario_id')
      .equals(usuario_id)
      .and((r) => r.sincronizado && r.fecha < limite)
      .delete();
  }
}
