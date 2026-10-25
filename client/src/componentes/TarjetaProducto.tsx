import { Link } from 'react-router';
import { NOMBRE_CATEGORIA, formatearPrecio, type Producto } from '../tipos';
import { ImagenProducto } from './ImagenProducto';

function rangoTallas(tallas: Producto['tallas']): string {
  if (tallas.length === 0) return 'Talla única';
  if (tallas.length === 1) return tallas[0];
  return `${tallas[0]} – ${tallas[tallas.length - 1]}`;
}

export function TarjetaProducto({ producto }: { producto: Producto }) {
  const { stock } = producto;
  return (
    <Link to={`/producto/${producto.id}`} className="tarjeta">
      <div className="tarjeta-imagen">
        <ImagenProducto producto={producto} />
        {stock === 0 && <span className="etiqueta etiqueta-agotado">Agotado</span>}
        {stock > 0 && stock <= 5 && <span className="etiqueta etiqueta-pocas">Últimas unidades</span>}
      </div>
      <div className="tarjeta-info">
        <span className="sobretitulo">{NOMBRE_CATEGORIA[producto.categoria]}</span>
        <h3>{producto.nombre}</h3>
        <div className="tarjeta-pie">
          <span className="precio">{formatearPrecio(producto.precioCentavos)}</span>
          <span className="tallas-mini">{rangoTallas(producto.tallas)}</span>
        </div>
      </div>
    </Link>
  );
}

/** Tarjeta "fantasma" que se muestra mientras cargan los productos. */
export function TarjetaEsqueleto() {
  return (
    <div className="tarjeta esqueleto" aria-hidden="true">
      <div className="tarjeta-imagen" />
      <div className="tarjeta-info">
        <span className="linea corta" />
        <span className="linea" />
        <span className="linea media" />
      </div>
    </div>
  );
}
