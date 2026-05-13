import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { IonContent } from '@ionic/angular/standalone';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';
import { Turno } from '../../core/models';

interface TurnoOption {
  valor: Turno;
  label: string;
  emoji: string;
  horario: string;
}

interface NumKey {
  num: string;
  letters: string;
}

interface Validacion {
  texto: string;
  ok: boolean;
}

@Component({
  selector: 'app-registro',
  templateUrl: 'registro.page.html',
  styleUrls: ['registro.page.scss'],
  imports: [IonContent, FormsModule, RouterLink],
})
export class RegistroPage {
  private readonly api     = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router  = inject(Router);

  step: 1 | 2 | 3      = 1;
  username              = '';
  turnoSeleccionado: Turno = 'Mañana';
  pin                   = '';
  pinConfirm            = '';
  pinEtapa: 'elegir' | 'confirmar' = 'elegir';
  loading               = false;
  error                 = '';
  shake                 = false;

  readonly dots        = [0, 1, 2, 3];
  readonly sugerencias = ['ops-norte', 'turno.am', 'jefe01', 'mx2025'];

  readonly turnos: TurnoOption[] = [
    { valor: 'Mañana',        label: 'Mañana',        emoji: '🌅', horario: '06:35 – 14:18' },
    { valor: 'Tarde',         label: 'Tarde',         emoji: '☀️', horario: '14:20 – 22:03' },
    { valor: 'Noche',         label: 'Noche',         emoji: '🌙', horario: '22:05 – 06:10' },
    { valor: 'Noche Domingo', label: 'Noche Domingo', emoji: '😴', horario: '00:20 – 06:10' },
  ];

  readonly numKeys: NumKey[] = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
    { num: '',  letters: '' },
    { num: '0', letters: '+' },
    { num: '⌫', letters: '' },
  ];

  private readonly USERNAME_REGEX = /^[a-zA-Z0-9\-._]{3,30}$/;

  get usernameValido(): boolean {
    return this.USERNAME_REGEX.test(this.username);
  }

  get validaciones(): Validacion[] {
    const u = this.username;
    return [
      { texto: '3 a 30 caracteres',             ok: u.length >= 3 && u.length <= 30 },
      { texto: 'Sin espacios',                   ok: u.length > 0 && !u.includes(' ') },
      { texto: 'Letras, números, guiones o .', ok: u.length > 0 && /^[a-zA-Z0-9\-._]+$/.test(u) },
    ];
  }

  get pinActual(): string {
    return this.pinEtapa === 'elegir' ? this.pin : this.pinConfirm;
  }

  usarSugerencia(nombre: string): void {
    this.username = nombre;
    this.error    = '';
  }

  siguientePaso(): void {
    this.error = '';
    if (this.step === 1 && this.usernameValido) {
      this.step = 2;
    } else if (this.step === 2) {
      this.step = 3;
    }
  }

  pasoPrevio(): void {
    this.error = '';
    if (this.step === 3) {
      this.step       = 2;
      this.pin        = '';
      this.pinConfirm = '';
      this.pinEtapa   = 'elegir';
    } else if (this.step === 2) {
      this.step = 1;
    }
  }

  presionarTecla(tecla: string): void {
    if (!tecla || this.loading) return;
    this.error = '';

    if (tecla === '⌫') {
      if (this.pinEtapa === 'elegir') {
        this.pin = this.pin.slice(0, -1);
      } else {
        this.pinConfirm = this.pinConfirm.slice(0, -1);
      }
      return;
    }

    if (this.pinEtapa === 'elegir') {
      if (this.pin.length < 4) {
        this.pin += tecla;
        if (this.pin.length === 4) {
          setTimeout(() => { this.pinEtapa = 'confirmar'; }, 300);
        }
      }
    } else {
      if (this.pinConfirm.length < 4) {
        this.pinConfirm += tecla;
        if (this.pinConfirm.length === 4) {
          setTimeout(() => { this.validarPins(); }, 150);
        }
      }
    }
  }

  private validarPins(): void {
    if (this.pin !== this.pinConfirm) {
      this.error  = 'Los PINs no coinciden. Intenta de nuevo';
      this.shake  = true;
      setTimeout(() => {
        this.shake      = false;
        this.pinConfirm = '';
      }, 550);
    } else {
      this.registrar();
    }
  }

  private registrar(): void {
    this.loading = true;
    this.error   = '';

    this.api.registro({
      username:      this.username.trim(),
      pin:           this.pin,
      turno_default: this.turnoSeleccionado,
    }).subscribe({
      next: (res) => {
        this.storage.setToken(res.token);
        this.storage.setUsuario(res.usuario);
        void this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading    = false;
        this.pin        = '';
        this.pinConfirm = '';
        this.pinEtapa   = 'elegir';
        if (err.status === 409) {
          this.step  = 1;
          this.error = 'Ese nombre ya está en uso. Elige otro';
        } else {
          this.error = 'Error al crear cuenta. Intenta de nuevo';
        }
      },
    });
  }
}
