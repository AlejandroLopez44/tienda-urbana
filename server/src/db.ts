import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

export const ROLES = ['cliente', 'admin'] as const;
export type Rol = (typeof ROLES)[number];

export const CATEGORIAS = ['hombre', 'mujer', 'unisex'] as const;
export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export function abrirDb(ruta: string): DatabaseSync {
  const db = new DatabaseSync(ruta);
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS usuarios (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre        TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol           TEXT NOT NULL CHECK (rol IN ('cliente', 'admin')),
      creado_en     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- El precio se guarda en centavos (entero) para evitar errores de redondeo.
    CREATE TABLE IF NOT EXISTS productos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre          TEXT NOT NULL,
      descripcion     TEXT NOT NULL DEFAULT '',
      precio_centavos INTEGER NOT NULL CHECK (precio_centavos >= 0),
      categoria       TEXT NOT NULL CHECK (categoria IN ('hombre', 'mujer', 'unisex')),
      tallas          TEXT NOT NULL DEFAULT '[]',
      stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      imagen_url      TEXT,
      creado_en       TEXT NOT NULL DEFAULT (datetime('now')),
      actualizado_en  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

interface DatosAdmin {
  nombre: string;
  email: string;
  password: string;
}

/** Crea el administrador inicial y productos de ejemplo si la base está vacía. */
export function sembrarDatos(db: DatabaseSync, admin: DatosAdmin): void {
  const hayAdmin = db.prepare("SELECT 1 FROM usuarios WHERE rol = 'admin' LIMIT 1").get();
  if (!hayAdmin) {
    db.prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)').run(
      admin.nombre,
      admin.email.trim().toLowerCase(),
      bcrypt.hashSync(admin.password, 10),
      'admin',
    );
  }

  const { total } = db.prepare('SELECT COUNT(*) AS total FROM productos').get() as { total: number };
  if (total > 0) return;

  const insertar = db.prepare(
    'INSERT INTO productos (nombre, descripcion, precio_centavos, categoria, tallas, stock) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const ejemplos: [string, string, number, string, string[], number][] = [
    ['Hoodie Oversize "Concreto"', 'Algodón pesado de 400 g, capucha doble y corte amplio.', 4500, 'unisex', ['S', 'M', 'L', 'XL'], 20],
    ['Cargo Pants "Ruta 9"', 'Pantalón cargo color oliva con seis bolsillos y ajuste en el tobillo.', 5200, 'hombre', ['M', 'L', 'XL'], 12],
    ['Camiseta Boxy "Neón"', 'Corte cuadrado, cuello grueso y estampado reflectivo en la espalda.', 2200, 'unisex', ['XS', 'S', 'M', 'L', 'XL'], 35],
    ['Bomber "Asfalto"', 'Chaqueta bomber negra con forro naranja y parches bordados.', 8900, 'hombre', ['M', 'L', 'XL', 'XXL'], 6],
    ['Top Corto "Graffiti"', 'Top de algodón con estampado de graffiti hecho a mano.', 1900, 'mujer', ['XS', 'S', 'M'], 18],
    ['Jogger "Skyline"', 'Jogger de felpa con franjas laterales y cintura elástica.', 3800, 'mujer', ['XS', 'S', 'M', 'L'], 15],
    ['Gorra Snapback "Bloque"', 'Visera plana, bordado 3D y cierre ajustable. Talla única.', 1800, 'unisex', [], 40],
    ['Falda Cargo "Metro"', 'Falda midi estilo cargo con bolsillos laterales y cinturón.', 3500, 'mujer', ['S', 'M', 'L'], 9],
    ['Chaqueta Denim "Underground"', 'Denim lavado en piedra con parches en los codos.', 6900, 'mujer', ['S', 'M', 'L'], 0],
    ['Short Basketball "Cancha"', 'Short de malla transpirable, largo hasta la rodilla.', 2600, 'hombre', ['S', 'M', 'L', 'XL'], 25],
  ];

  db.exec('BEGIN');
  try {
    for (const [nombre, descripcion, precio, categoria, tallas, stock] of ejemplos) {
      insertar.run(nombre, descripcion, precio, categoria, JSON.stringify(tallas), stock);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
