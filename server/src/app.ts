import express, { type ErrorRequestHandler } from 'express';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { ErrorHttp } from './errores';
import { rutasAuth } from './rutas/auth';
import { rutasProductos } from './rutas/productos';

interface Config {
  jwtSecret: string;
  /** Carpeta con el frontend compilado (client/dist). Solo se usa en producción. */
  carpetaWeb?: string;
}

const manejarErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ErrorHttp) {
    res.status(err.status).json({ error: err.message, detalles: err.detalles });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};

/** Construye la app sin arrancarla, para poder usarla igual en el servidor y en las pruebas. */
export function crearApp(db: DatabaseSync, config: Config) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/auth', rutasAuth(db, config.jwtSecret));
  app.use('/api/productos', rutasProductos(db, config.jwtSecret));
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  if (config.carpetaWeb) {
    const carpeta = config.carpetaWeb;
    app.use(express.static(carpeta));
    // Cualquier otra ruta (/admin, /producto/3…) la resuelve React Router en el navegador.
    app.use((_req, res) => {
      res.sendFile(path.join(carpeta, 'index.html'));
    });
  }

  app.use(manejarErrores);
  return app;
}
