import { Turno } from '../types/models';

const USERNAME_REGEX = /^[a-zA-Z0-9\-._]{3,30}$/;
const PIN_REGEX = /^\d{4}$/;
const TURNOS_VALIDOS: readonly Turno[] = ['Mañana', 'Tarde', 'Noche', 'Noche Domingo'];

export function esUsernameValido(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export function esPinValido(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

export function esTurnoValido(turno: string): turno is Turno {
  return (TURNOS_VALIDOS as readonly string[]).includes(turno);
}
