import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { crearApp } from './app';
import { abrirDb, sembrarDatos } from './db';

try {
  process.loadEnvFile('.env');
} catch {
  // Sin archivo .env: se usan las variables de entorno del sistema.
}

const { JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!JWT_SECRET || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Faltan variables en server/.env. Copia server/.env.example como server/.env y complétalo.');
  process.exit(1);
}

mkdirSync('data', { recursive: true });
const db = abrirDb(path.join('data', 'tienda.db'));
sembrarDatos(db, { nombre: 'Administrador', email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

const puerto = Number(process.env.PUERTO ?? 3001);
crearApp(db, { jwtSecret: JWT_SECRET }).listen(puerto, () => {
  console.log(`API lista en http://localhost:${puerto}`);
});
