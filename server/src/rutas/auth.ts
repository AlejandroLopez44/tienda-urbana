import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { firmarToken, requiereAuth, type UsuarioToken } from '../auth';
import { ErrorHttp, validar } from '../errores';

const email = z.string().trim().toLowerCase().pipe(z.email());

// El rol no se acepta desde fuera: todo registro público crea un cliente.
const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2).max(80),
  email,
  password: z.string().min(8).max(72),
});

const esquemaLogin = z.object({
  email,
  password: z.string().min(1),
});

interface FilaUsuario extends UsuarioToken {
  password_hash: string;
}

export function rutasAuth(db: DatabaseSync, jwtSecret: string): Router {
  const router = Router();
  const buscarPorEmail = db.prepare('SELECT id, nombre, email, rol, password_hash FROM usuarios WHERE email = ?');

  router.post('/registro', (req, res) => {
    const datos = validar(esquemaRegistro, req.body);
    if (buscarPorEmail.get(datos.email)) throw new ErrorHttp(409, 'Ya existe una cuenta con ese email');

    const { lastInsertRowid } = db
      .prepare("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'cliente')")
      .run(datos.nombre, datos.email, bcrypt.hashSync(datos.password, 10));

    const usuario: UsuarioToken = { id: Number(lastInsertRowid), nombre: datos.nombre, email: datos.email, rol: 'cliente' };
    res.status(201).json({ token: firmarToken(usuario, jwtSecret), usuario });
  });

  router.post('/login', (req, res) => {
    const datos = validar(esquemaLogin, req.body);
    const fila = buscarPorEmail.get(datos.email) as FilaUsuario | undefined;
    // Mismo mensaje para email o contraseña incorrectos: no revelamos qué cuentas existen.
    if (!fila || !bcrypt.compareSync(datos.password, fila.password_hash)) {
      throw new ErrorHttp(401, 'Email o contraseña incorrectos');
    }
    const usuario: UsuarioToken = { id: fila.id, nombre: fila.nombre, email: fila.email, rol: fila.rol };
    res.json({ token: firmarToken(usuario, jwtSecret), usuario });
  });

  router.get('/yo', requiereAuth(jwtSecret), (req, res) => {
    const usuario = db
      .prepare('SELECT id, nombre, email, rol, creado_en AS creadoEn FROM usuarios WHERE id = ?')
      .get(req.usuario!.id);
    if (!usuario) throw new ErrorHttp(401, 'La cuenta ya no existe');
    res.json(usuario);
  });

  return router;
}
