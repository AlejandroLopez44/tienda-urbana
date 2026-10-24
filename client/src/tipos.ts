export const CATEGORIAS = ['hombre', 'mujer', 'unisex'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export type Talla = (typeof TALLAS)[number];

export type Rol = 'cliente' | 'admin';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  creadoEn?: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precioCentavos: number;
  categoria: Categoria;
  tallas: Talla[];
  stock: number;
  imagenUrl: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

/** Lo que envía el formulario del admin al crear o editar un producto. */
export type DatosProducto = Omit<Producto, 'id' | 'creadoEn' | 'actualizadoEn'>;

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  hombre: 'Hombre',
  mujer: 'Mujer',
  unisex: 'Unisex',
};

const formatoPrecio = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' });

export function formatearPrecio(centavos: number): string {
  return formatoPrecio.format(centavos / 100);
}
