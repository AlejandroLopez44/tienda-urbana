import type { Categoria, DatosProducto, Producto, Usuario } from './tipos';

const CLAVE_TOKEN = 'asfalto.token';

/** El token se guarda en localStorage; los accesos van en try/catch por si el navegador lo bloquea. */
export const tokenGuardado = {
  leer(): string | null {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar(token: string) {
    try {
      localStorage.setItem(CLAVE_TOKEN, token);
    } catch {
      /* sin almacenamiento: la sesión dura lo que la pestaña */
    }
  },
  borrar() {
    try {
      localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* nada que borrar */
    }
  },
};

export interface DetalleError {
  campo: string;
  mensaje: string;
}

export class ErrorApi extends Error {
  constructor(
    message: string,
    public status: number,
    public detalles: DetalleError[] = [],
  ) {
    super(message);
  }
}

async function pedir<T>(ruta: string, metodo = 'GET', cuerpo?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenGuardado.leer();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  if (res.status === 204) return undefined as T;

  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorApi(datos.error ?? 'Error inesperado del servidor', res.status, datos.detalles);
  return datos as T;
}

interface RespuestaSesion {
  token: string;
  usuario: Usuario;
}

export const api = {
  auth: {
    login: (email: string, password: string) => pedir<RespuestaSesion>('/auth/login', 'POST', { email, password }),
    registro: (nombre: string, email: string, password: string) =>
      pedir<RespuestaSesion>('/auth/registro', 'POST', { nombre, email, password }),
    yo: () => pedir<Usuario>('/auth/yo'),
  },
  productos: {
    listar: (filtros: { categoria?: Categoria; q?: string } = {}) => {
      const params = new URLSearchParams();
      if (filtros.categoria) params.set('categoria', filtros.categoria);
      if (filtros.q) params.set('q', filtros.q);
      return pedir<Producto[]>(`/productos?${params}`);
    },
    obtener: (id: number) => pedir<Producto>(`/productos/${id}`),
    crear: (datos: DatosProducto) => pedir<Producto>('/productos', 'POST', datos),
    actualizar: (id: number, datos: DatosProducto) => pedir<Producto>(`/productos/${id}`, 'PUT', datos),
    eliminar: (id: number) => pedir<void>(`/productos/${id}`, 'DELETE'),
  },
};
