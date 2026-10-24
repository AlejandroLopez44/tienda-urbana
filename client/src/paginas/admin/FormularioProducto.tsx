import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ErrorApi, api } from '../../api';
import { CATEGORIAS, NOMBRE_CATEGORIA, TALLAS, type Categoria, type Talla } from '../../tipos';

interface Campos {
  nombre: string;
  descripcion: string;
  precio: string; // en dólares, tal como lo escribe el admin
  categoria: Categoria;
  tallas: Talla[];
  stock: string;
  imagenUrl: string;
}

const VACIO: Campos = { nombre: '', descripcion: '', precio: '', categoria: 'unisex', tallas: [], stock: '0', imagenUrl: '' };

export function FormularioProducto() {
  const { id } = useParams();
  const esEdicion = id !== undefined;
  const navegar = useNavigate();

  const [campos, setCampos] = useState<Campos>(VACIO);
  const [cargando, setCargando] = useState(esEdicion);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!esEdicion) return;
    api.productos
      .obtener(Number(id))
      .then((p) =>
        setCampos({
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: (p.precioCentavos / 100).toFixed(2),
          categoria: p.categoria,
          tallas: p.tallas,
          stock: String(p.stock),
          imagenUrl: p.imagenUrl ?? '',
        }),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id, esEdicion]);

  function cambiar<K extends keyof Campos>(campo: K, valor: Campos[K]) {
    setCampos((actual) => ({ ...actual, [campo]: valor }));
  }

  function alternarTalla(talla: Talla) {
    cambiar(
      'tallas',
      campos.tallas.includes(talla)
        ? campos.tallas.filter((t) => t !== talla)
        : TALLAS.filter((t) => t === talla || campos.tallas.includes(t)),
    );
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setErroresCampo({});

    const datos = {
      nombre: campos.nombre,
      descripcion: campos.descripcion,
      precioCentavos: Math.round(Number(campos.precio) * 100),
      categoria: campos.categoria,
      tallas: campos.tallas,
      stock: Number(campos.stock),
      imagenUrl: campos.imagenUrl.trim() || null,
    };

    setEnviando(true);
    try {
      if (esEdicion) await api.productos.actualizar(Number(id), datos);
      else await api.productos.crear(datos);
      navegar('/admin');
    } catch (err) {
      setError((err as Error).message);
      if (err instanceof ErrorApi) {
        setErroresCampo(Object.fromEntries(err.detalles.map((d) => [d.campo.split('.')[0], d.mensaje])));
      }
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <p className="estado">Cargando producto…</p>;

  const errorDe = (campo: string) => erroresCampo[campo] && <span className="error-campo">{erroresCampo[campo]}</span>;

  return (
    <form className="formulario" onSubmit={enviar}>
      <Link to="/admin" className="tenue">← Volver al panel</Link>
      <h1>{esEdicion ? 'Editar producto' : 'Nuevo producto'}</h1>
      {error && <p className="alerta">{error}</p>}

      <label>
        Nombre
        <input required minLength={2} maxLength={100} value={campos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
        {errorDe('nombre')}
      </label>

      <label>
        Descripción
        <textarea rows={3} maxLength={1000} value={campos.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
        {errorDe('descripcion')}
      </label>

      <div className="fila-campos">
        <label>
          Precio (USD)
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={campos.precio}
            onChange={(e) => cambiar('precio', e.target.value)}
          />
          {errorDe('precioCentavos')}
        </label>
        <label>
          Stock
          <input type="number" required min="0" step="1" value={campos.stock} onChange={(e) => cambiar('stock', e.target.value)} />
          {errorDe('stock')}
        </label>
        <label>
          Categoría
          <select value={campos.categoria} onChange={(e) => cambiar('categoria', e.target.value as Categoria)}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{NOMBRE_CATEGORIA[c]}</option>
            ))}
          </select>
          {errorDe('categoria')}
        </label>
      </div>

      <fieldset>
        <legend>Tallas <span className="tenue">(ninguna = talla única)</span></legend>
        <div className="chips">
          {TALLAS.map((t) => (
            <button
              type="button"
              key={t}
              className={campos.tallas.includes(t) ? 'chip activo' : 'chip'}
              aria-pressed={campos.tallas.includes(t)}
              onClick={() => alternarTalla(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {errorDe('tallas')}
      </fieldset>

      <label>
        URL de la imagen <span className="tenue">(opcional)</span>
        <input type="url" placeholder="https://…" value={campos.imagenUrl} onChange={(e) => cambiar('imagenUrl', e.target.value)} />
        {errorDe('imagenUrl')}
      </label>

      <div className="acciones">
        <button className="boton" disabled={enviando}>
          {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <Link to="/admin" className="boton boton-secundario">Cancelar</Link>
      </div>
    </form>
  );
}
