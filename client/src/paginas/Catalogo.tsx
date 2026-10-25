import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../api';
import { TarjetaEsqueleto, TarjetaProducto } from '../componentes/TarjetaProducto';
import { CATEGORIAS, NOMBRE_CATEGORIA, type Categoria, type Producto } from '../tipos';

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
    setProductos(null);
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

  const descripcionFiltro = [
    categoria && `en ${NOMBRE_CATEGORIA[categoria]}`,
    q && `para “${q}”`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <section className="hero">
        <div className="hero-texto">
          <p className="sobretitulo sobretitulo-acento">Nueva colección · Otoño 2026</p>
          <h1>Hecho para la calle.</h1>
          <p>Hoodies, cargos y básicos con actitud. Para ellos, para ellas, para todos.</p>
        </div>
        <div className="hero-prendas" aria-hidden="true">
          <img src="/productos/bomber-asfalto.svg" alt="" width={400} height={500} />
          <img src="/productos/hoodie-concreto.svg" alt="" width={400} height={500} />
        </div>
      </section>

      <div className="barra-filtros">
        <div className="chips chips-desplazables" role="group" aria-label="Filtrar por categoría">
          <button
            className={!categoria ? 'chip activo' : 'chip'}
            aria-pressed={!categoria}
            onClick={() => cambiarFiltro({ categoria: undefined })}
          >
            Todo
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              className={categoria === c ? 'chip activo' : 'chip'}
              aria-pressed={categoria === c}
              onClick={() => cambiarFiltro({ categoria: c })}
            >
              {NOMBRE_CATEGORIA[c]}
            </button>
          ))}
        </div>
        <form className="buscador" role="search" onSubmit={buscar}>
          <svg className="icono-buscar" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            placeholder="Buscar hoodie, cargo, gorra…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar productos"
          />
          <button className="boton boton-chico">Buscar</button>
        </form>
      </div>

      {error && <p className="alerta">{error}</p>}

      {productos && (
        <p className="conteo">
          {productos.length} {productos.length === 1 ? 'producto' : 'productos'} {descripcionFiltro}
          {(categoria || q) && (
            <button className="boton-texto" onClick={() => cambiarFiltro({ categoria: undefined, q: undefined })}>
              Limpiar filtros
            </button>
          )}
        </p>
      )}

      {productos?.length === 0 && (
        <div className="vacio">
          <p>No encontramos productos con esos filtros.</p>
        </div>
      )}

      <div className="rejilla">
        {!productos && !error && Array.from({ length: 8 }, (_, i) => <TarjetaEsqueleto key={i} />)}
        {productos?.map((p) => <TarjetaProducto key={p.id} producto={p} />)}
      </div>
    </>
  );
}
