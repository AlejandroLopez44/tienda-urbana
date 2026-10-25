import { useState } from 'react';
import type { Producto } from '../tipos';

type DatosImagen = Pick<Producto, 'id' | 'nombre' | 'imagenUrl'>;

/** Muestra la imagen del producto o, si no tiene (o falla), un bloque de color con sus iniciales. */
export function ImagenProducto({ producto, className = '' }: { producto: DatosImagen; className?: string }) {
  const [fallo, setFallo] = useState(false);

  if (producto.imagenUrl && !fallo) {
    return (
      <img
        className={`imagen-producto ${className}`}
        src={producto.imagenUrl}
        alt={producto.nombre}
        width={400}
        height={500}
        loading="lazy"
        decoding="async"
        onError={() => setFallo(true)}
      />
    );
  }

  const tono = (producto.id * 47) % 360;
  const iniciales = producto.nombre
    .replace(/["“”]/g, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('');

  return (
    <div
      className={`imagen-producto marcador ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${tono} 30% 22%), hsl(${(tono + 40) % 360} 35% 12%))` }}
      role="img"
      aria-label={producto.nombre}
    >
      <span>{iniciales}</span>
    </div>
  );
}
