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

  const { stock } = producto;
  const estadoStock =
    stock === 0
      ? { clase: 'agotado', texto: 'Agotado' }
      : stock <= 5
        ? { clase: 'pocas', texto: `Quedan solo ${stock}` }
        : { clase: '', texto: 'Disponible' };

  return (
    <>
      <Link to="/" className="volver">← Volver al catálogo</Link>
      <div className="detalle">
        <ImagenProducto producto={producto} className="detalle-imagen" />
        <div className="detalle-info">
          <Link to={`/?categoria=${producto.categoria}`} className="sobretitulo">
            {NOMBRE_CATEGORIA[producto.categoria]}
          </Link>
          <h1>{producto.nombre}</h1>
          <p className="precio precio-grande">{formatearPrecio(producto.precioCentavos)}</p>
          <span className={`pastilla-stock ${estadoStock.clase}`}>{estadoStock.texto}</span>
          <p className="descripcion">{producto.descripcion}</p>

          <div className="bloque-tallas">
            <h2 className="titulo-seccion">Talla</h2>
            {producto.tallas.length === 0 ? (
              <p className="tenue">Talla única</p>
            ) : (
              <div className="chips">
                {producto.tallas.map((t) => (
                  <button
                    key={t}
                    className={talla === t ? 'chip chip-talla activo' : 'chip chip-talla'}
                    aria-pressed={talla === t}
                    onClick={() => setTalla(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="boton boton-ancho" disabled title="El carrito llegará en una próxima versión">
            Carrito: próximamente
          </button>

          <dl className="ficha">
            <div>
              <dt>Código</dt>
              <dd>ASF-{String(producto.id).padStart(4, '0')}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{NOMBRE_CATEGORIA[producto.categoria]}</dd>
            </div>
            <div>
              <dt>Tallas</dt>
              <dd>{producto.tallas.length ? producto.tallas.join(' · ') : 'Única'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
