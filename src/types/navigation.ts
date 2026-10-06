export type ActiveTab = 'catalogo' | 'favoritos' | 'nuevo' | 'respaldo';

export interface ToastMessage {
  id: string;
  type: 'exito' | 'error' | 'info';
  message: string;
}
