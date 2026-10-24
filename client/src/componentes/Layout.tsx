import { startTransition } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../auth';

export function Layout() {
  const { usuario, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  return (
    <>
      <header className="cabecera">
        <Link to="/" className="logo">ASFALTO</Link>
        <nav className="nav">
          <NavLink to="/" end>Todo</NavLink>
          <Link to="/?categoria=hombre">Hombre</Link>
          <Link to="/?categoria=mujer">Mujer</Link>
          <Link to="/?categoria=unisex">Unisex</Link>
        </nav>
        <div className="sesion">
          {usuario ? (
            <>
              {usuario.rol === 'admin' && <NavLink to="/admin" className="insignia">Panel admin</NavLink>}
              <NavLink to="/mi-cuenta">{usuario.nombre}</NavLink>
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
              <NavLink to="/login">Entrar</NavLink>
              <Link to="/registro" className="boton boton-chico">Crear cuenta</Link>
            </>
          )}
        </div>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
      <footer className="pie">ASFALTO · Ropa urbana · Proyecto de práctica</footer>
    </>
  );
}
