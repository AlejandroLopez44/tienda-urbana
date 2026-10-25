import { startTransition } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth';

export function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  return (
    <>
      <header className="cabecera">
        <div className="cabecera-interior">
          <Link to="/" className="logo">ASFALTO</Link>
          <nav className="sesion" aria-label="Cuenta">
            {usuario ? (
              <>
                {usuario.rol === 'admin' && <NavLink to="/admin" className="insignia-admin">Admin</NavLink>}
                <NavLink to="/mi-cuenta" className="enlace-cuenta" title="Mi cuenta">
                  <span className="avatar" aria-hidden="true">{usuario.nombre.charAt(0).toUpperCase()}</span>
                  <span className="nombre-usuario">{usuario.nombre}</span>
                </NavLink>
                <button
                  className="boton-texto"
                  onClick={() => {
                    // Ambos cambios en una sola transición: si no, la página protegida
                    // se vería un instante sin sesión y redirigiría a /login.
                    startTransition(() => {
                      navegar('/');
                      cerrarSesion();
                    });
                  }}
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="enlace-sesion">Entrar</NavLink>
                <Link to="/registro" className="boton boton-chico">Crear cuenta</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
      <footer className="pie">
        <div className="pie-interior">
          <Link to="/" className="logo">ASFALTO</Link>
          <p>Ropa urbana para ellos, para ellas, para todos.</p>
          <p className="tenue">Proyecto de práctica · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </>
  );
}
