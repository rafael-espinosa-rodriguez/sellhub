export type ActiveTab = 'catalogo' | 'favoritos' | 'nuevo' | 'respaldo' | 'categorias';

export interface ToastMessage {
  id: string;
  type: 'exito' | 'error' | 'info';
  message: string;
}
