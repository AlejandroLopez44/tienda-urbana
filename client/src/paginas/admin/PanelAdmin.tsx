import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../api';
import { ImagenProducto } from '../../componentes/ImagenProducto';
import { NOMBRE_CATEGORIA, formatearPrecio, type Producto } from '../../tipos';

export function PanelAdmin() {
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');

  function cargar() {
    api.productos
      .listar()
      .then(setProductos)
      .catch((e: Error) => setError(e.message));
  }

  useEffect(cargar, []);

  async function eliminar(producto: Producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.productos.eliminar(producto.id);
      setProductos((lista) => lista?.filter((p) => p.id !== producto.id) ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const visibles = productos?.filter((p) => p.nombre.toLowerCase().includes(filtro.trim().toLowerCase())) ?? [];
  const unidades = productos?.reduce((total, p) => total + p.stock, 0) ?? 0;
  const agotados = productos?.filter((p) => p.stock === 0).length ?? 0;

  return (
    <div className="panel">
      <div className="panel-encabezado">
        <h1>Panel de administración</h1>
        <Link to="/admin/productos/nuevo" className="boton">+ Nuevo producto</Link>
      </div>

      <div className="tarjetas-resumen">
        <div className="resumen">
          <span className="tenue">Productos</span>
          <strong>{productos?.length ?? '–'}</strong>
        </div>
        <div className="resumen">
          <span className="tenue">Unidades en stock</span>
          <strong>{unidades}</strong>
        </div>
        <div className="resumen">
          <span className="tenue">Agotados</span>
          <strong className={agotados > 0 ? 'texto-alerta' : ''}>{agotados}</strong>
        </div>
      </div>

      {error && <p className="alerta">{error}</p>}

      <input
        type="search"
        className="filtro-tabla"
        placeholder="Filtrar por nombre…"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        aria-label="Filtrar productos"
      />

      {!productos && !error && <p className="estado">Cargando…</p>}
      {productos && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th></th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => (
                <tr key={p.id}>
                  <td><ImagenProducto producto={p} className="miniatura" /></td>
                  <td>
                    <Link to={`/producto/${p.id}`}>{p.nombre}</Link>
                  </td>
                  <td>{NOMBRE_CATEGORIA[p.categoria]}</td>
                  <td>{formatearPrecio(p.precioCentavos)}</td>
                  <td className={p.stock === 0 ? 'texto-alerta' : ''}>{p.stock}</td>
                  <td className="acciones">
                    <Link to={`/admin/productos/${p.id}/editar`} className="boton boton-chico boton-secundario">
                      Editar
                    </Link>
                    <button className="boton boton-chico boton-peligro" onClick={() => eliminar(p)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="tenue">Ningún producto coincide.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
