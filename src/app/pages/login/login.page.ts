import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/services/storage.service';

interface NumKey {
  num: string;
  letters: string;
}

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  imports: [IonContent, FormsModule, RouterLink],
})
export class LoginPage {
  private readonly api     = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router  = inject(Router);

  username = '';
  pin      = '';
  loading  = false;
  error    = '';
  shake    = false;

  readonly dots    = [0, 1, 2, 3];
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

  presionarTecla(tecla: string): void {
    if (!tecla || this.loading) return;
    this.error = '';
    if (tecla === '⌫') {
      this.pin = this.pin.slice(0, -1);
    } else if (this.pin.length < 4) {
      this.pin += tecla;
      if (this.pin.length === 4) {
        this.submit();
      }
    }
  }

  submit(): void {
    if (this.loading || !this.username.trim() || this.pin.length !== 4) return;
    this.loading = true;
    this.error   = '';

    this.api.login({ username: this.username.trim(), pin: this.pin }).subscribe({
      next: (res) => {
        this.storage.setToken(res.token);
        this.storage.setUsuario(res.usuario);
        void this.router.navigate(['/home']);
      },
      error: () => {
        this.loading = false;
        this.error   = 'Usuario o PIN incorrecto';
        this.shake   = true;
        setTimeout(() => {
          this.shake = false;
          this.pin   = '';
        }, 550);
      },
    });
  }
}
