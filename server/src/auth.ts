import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { Rol } from './db';
import { ErrorHttp } from './errores';

export interface UsuarioToken {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export function firmarToken(usuario: UsuarioToken, secreto: string): string {
  const { id, nombre, email, rol } = usuario;
  return jwt.sign({ id, nombre, email, rol }, secreto, { expiresIn: '8h' });
}

/** Exige un token válido en la cabecera `Authorization: Bearer <token>`. */
export function requiereAuth(secreto: string): RequestHandler {
  return (req, _res, next) => {
    const cabecera = req.headers.authorization;
    if (!cabecera?.startsWith('Bearer ')) throw new ErrorHttp(401, 'Debes iniciar sesión');
    try {
      req.usuario = jwt.verify(cabecera.slice('Bearer '.length), secreto) as UsuarioToken;
    } catch {
      throw new ErrorHttp(401, 'Sesión inválida o expirada');
    }
    next();
  };
}

/** Exige que el usuario autenticado tenga el rol indicado. Va después de `requiereAuth`. */
export function requiereRol(rol: Rol): RequestHandler {
  return (req, _res, next) => {
    if (req.usuario?.rol !== rol) throw new ErrorHttp(403, 'No tienes permiso para esta acción');
    next();
  };
}
