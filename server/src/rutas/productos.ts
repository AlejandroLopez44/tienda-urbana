import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { requiereAuth, requiereRol } from '../auth';
import { CATEGORIAS, TALLAS } from '../db';
import { ErrorHttp, validar } from '../errores';

const esquemaProducto = z.object({
  nombre: z.string().trim().min(2).max(100),
  descripcion: z.string().trim().max(1000).default(''),
  precioCentavos: z.number().int().min(0).max(10_000_000),
  categoria: z.enum(CATEGORIAS),
  tallas: z.array(z.enum(TALLAS)).default([]),
  stock: z.number().int().min(0).max(100_000),
  imagenUrl: z.url({ protocol: /^https?$/ }).nullable().default(null),
});

const esquemaFiltros = z.object({
  categoria: z.enum(CATEGORIAS).optional(),
  q: z.string().trim().max(100).optional(),
});

const esquemaId = z.coerce.number().int().positive();

interface FilaProducto {
  id: number;
  nombre: string;
  descripcion: string;
  precio_centavos: number;
  categoria: string;
  tallas: string;
  stock: number;
  imagen_url: string | null;
  creado_en: string;
  actualizado_en: string;
}

/** Convierte una fila de SQLite (snake_case) al formato JSON de la API (camelCase). */
function aProducto(fila: FilaProducto) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    precioCentavos: fila.precio_centavos,
    categoria: fila.categoria,
    tallas: JSON.parse(fila.tallas) as string[],
    stock: fila.stock,
    imagenUrl: fila.imagen_url,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  };
}

export function rutasProductos(db: DatabaseSync, jwtSecret: string): Router {
  const router = Router();
  // Gestión de productos: solo administradores (primero se valida la sesión, luego el rol).
  const autenticado = requiereAuth(jwtSecret);
  const esAdmin = requiereRol('admin');

  const buscarPorId = (id: number) => {
    const fila = db.prepare('SELECT * FROM productos WHERE id = ?').get(id) as FilaProducto | undefined;
    if (!fila) throw new ErrorHttp(404, 'Producto no encontrado');
    return aProducto(fila);
  };

  // CatÃ¡logo: pÃºblico, lo puede consultar cualquiera.
  router.get('/', (req, res) => {
    const { categoria, q } = validar(esquemaFiltros, req.query);
    let sql = 'SELECT * FROM productos WHERE 1 = 1';
    const parametros: string[] = [];
    if (categoria) {
      sql += ' AND categoria = ?';
      parametros.push(categoria);
    }
    if (q) {
      sql += ' AND (nombre LIKE ? OR descripcion LIKE ?)';
      parametros.push(`%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY id DESC';
    const filas = db.prepare(sql).all(...parametros) as unknown as FilaProducto[];
    res.json(filas.map(aProducto));
  });

  router.get('/:id', (req, res) => {
    res.json(buscarPorId(validar(esquemaId, req.params.id)));
  });

  // GestiÃ³n: solo administradores.
  router.post('/', autenticado, esAdmin, (req, res) => {
    const p = validar(esquemaProducto, req.body);
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO productos (nombre, descripcion, precio_centavos, categoria, tallas, stock, imagen_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(p.nombre, p.descripcion, p.precioCentavos, p.categoria, JSON.stringify(p.tallas), p.stock, p.imagenUrl);
    res.status(201).json(buscarPorId(Number(lastInsertRowid)));
  });

  router.put('/:id', autenticado, esAdmin, (req, res) => {
    const id = validar(esquemaId, req.params.id);
    const p = validar(esquemaProducto, req.body);
    const { changes } = db
      .prepare(
        `UPDATE productos
         SET nombre = ?, descripcion = ?, precio_centavos = ?, categoria = ?, tallas = ?, stock = ?, imagen_url = ?,
             actualizado_en = datetime('now')
         WHERE id = ?`,
      )
      .run(p.nombre, p.descripcion, p.precioCentavos, p.categoria, JSON.stringify(p.tallas), p.stock, p.imagenUrl, id);
    if (changes === 0) throw new ErrorHttp(404, 'Producto no encontrado');
    res.json(buscarPorId(id));
  });

  router.delete('/:id', autenticado, esAdmin, (req, res) => {
    const id = validar(esquemaId, req.params.id);
    const { changes } = db.prepare('DELETE FROM productos WHERE id = ?').run(id);
    if (changes === 0) throw new ErrorHttp(404, 'Producto no encontrado');
    res.status(204).end();
  });

  return router;
}
