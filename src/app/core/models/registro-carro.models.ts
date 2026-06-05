export interface RegistroCarroPayload {
  fase: number;
  anden: number;
  capacidad_carro: number;
  num_locales: number;
  comentario?: string | null;
}

export interface RegistroCarroItem extends RegistroCarroPayload {
  id: number;
  created_at: string;
  updated_at: string;
}
