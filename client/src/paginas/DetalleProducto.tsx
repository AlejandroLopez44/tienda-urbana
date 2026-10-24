import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../api';
import { ImagenProducto } from '../componentes/ImagenProducto';
import { NOMBRE_CATEGORIA, formatearPrecio, type Producto, type Talla } from '../tipos';

export function DetalleProducto() {
  const { id } = useParams();
  const [producto, setProducto] = useState<Producto | null>(null);
  const [error, setError] = useState('');
  const [talla, setTalla] = useState<Talla | null>(null);

  useEffect(() => {
    api.productos
      .obtener(Number(id))
      .then(setProducto)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <p className="alerta">{error}</p>;
  if (!producto) return <p className="estado">Cargando…</p>;

  const agotado = producto.stock === 0;

  return (
    <div className="detalle">
      <ImagenProducto producto={producto} className="detalle-imagen" />
      <div className="detalle-info">
        <Link to={`/?categoria=${producto.categoria}`} className="tarjeta-categoria">
          {NOMBRE_CATEGORIA[producto.categoria]}
        </Link>
        <h1>{producto.nombre}</h1>
        <p className="precio precio-grande">{formatearPrecio(producto.precioCentavos)}</p>
        <p className="descripcion">{producto.descripcion}</p>

        <h4>Talla</h4>
        {producto.tallas.length === 0 ? (
          <p className="tenue">Talla única</p>
        ) : (
          <div className="chips">
            {producto.tallas.map((t) => (
              <button key={t} className={talla === t ? 'chip activo' : 'chip'} onClick={() => setTalla(t)}>
                {t}
              </button>
            ))}
          </div>
        )}

        <p className={agotado ? 'stock agotado' : 'stock'}>
          {agotado ? 'Agotado' : producto.stock <= 5 ? `¡Quedan solo ${producto.stock}!` : 'Disponible'}
        </p>
        <button className="boton boton-ancho" disabled title="El carrito llegará en una próxima versión">
          Carrito: próximamente
        </button>
      </div>
    </div>
  );
}
