import { Link } from 'react-router';
import { useAuth } from '../auth';
import { CATEGORIAS, NOMBRE_CATEGORIA } from '../tipos';

export function PanelCliente() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div className="panel">
      <h1>Hola, {usuario.nombre} 👋</h1>
      <div className="tarjetas-resumen">
        <div className="resumen">
          <span className="tenue">Email</span>
          <strong>{usuario.email}</strong>
        </div>
        <div className="resumen">
          <span className="tenue">Tipo de cuenta</span>
          <strong>{usuario.rol === 'admin' ? 'Administrador' : 'Cliente'}</strong>
        </div>
        {usuario.creadoEn && (
          <div className="resumen">
            <span className="tenue">Cliente desde</span>
            <strong>{new Date(usuario.creadoEn + 'Z').toLocaleDateString('es-VE')}</strong>
          </div>
        )}
      </div>

      <h2>Explora la tienda</h2>
      <div className="chips">
        {CATEGORIAS.map((c) => (
          <Link key={c} to={`/?categoria=${c}`} className="chip">
            {NOMBRE_CATEGORIA[c]}
          </Link>
        ))}
      </div>
      <p className="tenue">Pronto podrás ver aquí tu carrito y tus pedidos.</p>
    </div>
  );
}
