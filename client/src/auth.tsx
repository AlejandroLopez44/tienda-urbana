import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { api, tokenGuardado } from './api';
import type { Rol, Usuario } from './tipos';

interface ContextoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<Usuario>;
  registrarse: (nombre: string, email: string, password: string) => Promise<Usuario>;
  cerrarSesion: () => void;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(() => tokenGuardado.leer() !== null);

  // Si hay un token guardado, recuperamos la sesión al cargar la página.
  useEffect(() => {
    if (!tokenGuardado.leer()) return;
    api.auth
      .yo()
      .then(setUsuario)
      .catch(() => tokenGuardado.borrar())
      .finally(() => setCargando(false));
  }, []);

  async function abrirSesion(promesa: ReturnType<typeof api.auth.login>) {
    const { token, usuario } = await promesa;
    tokenGuardado.guardar(token);
    setUsuario(usuario);
    return usuario;
  }

  const valor: ContextoAuth = {
    usuario,
    cargando,
    iniciarSesion: (email, password) => abrirSesion(api.auth.login(email, password)),
    registrarse: (nombre, email, password) => abrirSesion(api.auth.registro(nombre, email, password)),
    cerrarSesion: () => {
      tokenGuardado.borrar();
      setUsuario(null);
    },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <ProveedorAuth>');
  return contexto;
}

/**
 * Protege una página en el navegador. Es solo para la experiencia de uso:
 * la seguridad real la aplica el servidor en cada petición.
 */
export function RutaProtegida({ rol, children }: { rol?: Rol; children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) return <p className="estado">Cargando sesión…</p>;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />;
  if (rol && usuario.rol !== rol) {
    return (
      <div className="estado">
        <h2>Acceso denegado</h2>
        <p>Esta sección es solo para administradores.</p>
      </div>
    );
  }
  return children;
}
