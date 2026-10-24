import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api';
import { ImagenProducto } from '../componentes/ImagenProducto';
import { CATEGORIAS, NOMBRE_CATEGORIA, formatearPrecio, type Categoria, type Producto } from '../tipos';

export function Catalogo() {
  const [params, setParams] = useSearchParams();
  const categoriaParam = params.get('categoria');
  const categoria = CATEGORIAS.includes(categoriaParam as Categoria) ? (categoriaParam as Categoria) : undefined;
  const q = params.get('q') ?? '';

  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState(q);

  useEffect(() => {
    let vigente = true;
    setError('');
    api.productos
      .listar({ categoria, q: q || undefined })
      .then((lista) => vigente && setProductos(lista))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [categoria, q]);

  useEffect(() => setBusqueda(q), [q]);

  function cambiarFiltro(cambios: Record<string, string | undefined>) {
    const nuevos = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) nuevos.set(clave, valor);
      else nuevos.delete(clave);
    }
    setParams(nuevos);
  }

  function buscar(e: FormEvent) {
    e.preventDefault();
    cambiarFiltro({ q: busqueda.trim() || undefined });
  }

  return (
    <>
      <section className="hero">
        <p className="hero-etiqueta">Nueva colección · Otoño 2026</p>
        <h1>Hecho para la calle.</h1>
        <p>Hoodies, cargos y básicos con actitud. Para ellos, para ellas, para todos.</p>
      </section>

      <div className="filtros">
        <div className="chips">
          <button className={!categoria ? 'chip activo' : 'chip'} onClick={() => cambiarFiltro({ categoria: undefined })}>
            Todo
          </button>
          {CATEGORIAS.map((c) => (
            <button key={c} className={categoria === c ? 'chip activo' : 'chip'} onClick={() => cambiarFiltro({ categoria: c })}>
              {NOMBRE_CATEGORIA[c]}
            </button>
          ))}
        </div>
        <form className="buscador" onSubmit={buscar}>
          <input
            type="search"
            placeholder="Buscar hoodie, cargo, gorra…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar productos"
          />
          <button className="boton">Buscar</button>
        </form>
      </div>

      {error && <p className="alerta">{error}</p>}
      {!productos && !error && <p className="estado">Cargando productos…</p>}
      {productos?.length === 0 && <p className="estado">No encontramos productos con esos filtros.</p>}

      <div className="rejilla">
        {productos?.map((p) => (
          <Link key={p.id} to={`/producto/${p.id}`} className="tarjeta">
            <div className="tarjeta-imagen">
              <ImagenProducto producto={p} />
              {p.stock === 0 && <span className="etiqueta-agotado">Agotado</span>}
            </div>
            <div className="tarjeta-info">
              <span className="tarjeta-categoria">{NOMBRE_CATEGORIA[p.categoria]}</span>
              <h3>{p.nombre}</h3>
              <span className="precio">{formatearPrecio(p.precioCentavos)}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
