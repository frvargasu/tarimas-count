import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ApiService } from '../../core/services/api.service';
import { RegistroCarroItem } from '../../core/models';

interface FormState {
  fase: number | null;
  anden: number | null;
  capacidad_carro: number | null;
  num_locales: number | null;
  comentarioTexto: string;
  chipsSeleccionados: Set<string>;
}

@Component({
  selector: 'app-registro-carro',
  templateUrl: 'registro-carro.page.html',
  styleUrls: ['registro-carro.page.scss'],
  imports: [IonContent, FormsModule],
})
export class RegistroCarroPage implements OnInit {
  private readonly api    = inject(ApiService);
  private readonly router = inject(Router);

  readonly fases           = [1, 2];
  readonly capacidades     = [14, 16, 18, 28, 30];
  readonly numLocalesOpts  = [1, 2, 3, 4, 5, 6];
  readonly chipsDisponibles = ['Prioridad', 'Retraso', 'Carga completa', 'Falta pallets', 'Revisión', 'Parcial', 'Dummy', 'Rechazo'];

  form: FormState = this.formVacio();
  errors: Partial<Record<keyof FormState, string>> = {};

  guardando      = false;
  confirmacion   = false;
  errorGeneral   = '';

  registros: RegistroCarroItem[] = [];
  cargandoLista  = false;

  ngOnInit(): void {
    void this.cargarRegistros();
  }

  private formVacio(): FormState {
    return {
      fase:              null,
      anden:             null,
      capacidad_carro:   null,
      num_locales:       null,
      comentarioTexto:   '',
      chipsSeleccionados: new Set<string>(),
    };
  }

  toggleChip(chip: string): void {
    if (this.form.chipsSeleccionados.has(chip)) {
      this.form.chipsSeleccionados.delete(chip);
    } else {
      this.form.chipsSeleccionados.add(chip);
    }
    // Trigger change detection for the Set
    this.form.chipsSeleccionados = new Set(this.form.chipsSeleccionados);
  }

  isChipActivo(chip: string): boolean {
    return this.form.chipsSeleccionados.has(chip);
  }

  private construirComentario(): string | null {
    const partes: string[] = [];
    if (this.form.chipsSeleccionados.size > 0) {
      partes.push(Array.from(this.form.chipsSeleccionados).join(', '));
    }
    if (this.form.comentarioTexto.trim()) {
      partes.push(this.form.comentarioTexto.trim());
    }
    return partes.length > 0 ? partes.join(' · ') : null;
  }

  private validar(): boolean {
    this.errors = {};
    if (this.form.fase === null) {
      this.errors['fase'] = 'La fase es obligatoria';
    }
    if (
      this.form.anden === null ||
      !Number.isInteger(Number(this.form.anden)) ||
      Number(this.form.anden) < 1
    ) {
      this.errors['anden'] = 'Ingresa un número de andén válido';
    }
    if (this.form.capacidad_carro === null) {
      this.errors['capacidad_carro'] = 'La capacidad es obligatoria';
    }
    if (this.form.num_locales === null) {
      this.errors['num_locales'] = 'El número de locales es obligatorio';
    }
    return Object.keys(this.errors).length === 0;
  }

  guardar(): void {
    if (this.guardando) return;
    this.errorGeneral = '';
    if (!this.validar()) return;

    this.guardando = true;

    this.api.crearRegistroCarro({
      fase:            Number(this.form.fase),
      anden:           Number(this.form.anden),
      capacidad_carro: Number(this.form.capacidad_carro),
      num_locales:     Number(this.form.num_locales),
      comentario:      this.construirComentario(),
    }).subscribe({
      next: (res) => {
        this.guardando   = false;
        this.confirmacion = true;
        this.registros   = [res.registro, ...this.registros].slice(0, 20);
        this.form        = this.formVacio();
        setTimeout(() => { this.confirmacion = false; }, 3000);
      },
      error: () => {
        this.guardando    = false;
        this.errorGeneral = 'Error al guardar. Intenta de nuevo.';
      },
    });
  }

  private async cargarRegistros(): Promise<void> {
    this.cargandoLista = true;
    this.api.listarRegistrosCarro().subscribe({
      next: (res) => {
        this.cargandoLista = false;
        this.registros     = res.registros;
      },
      error: () => {
        this.cargandoLista = false;
      },
    });
  }

  volver(): void {
    void this.router.navigate(['/home']);
  }

  formatFecha(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
