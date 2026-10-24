# ASFALTO · Tienda de ropa urbana

Proyecto de práctica: e-commerce con dos roles de usuario, todo en TypeScript.

| Rol | Qué puede hacer |
| --- | --- |
| Visitante / cliente | Ver el catálogo, filtrar por categoría, buscar, ver detalle; el cliente además tiene su panel "Mi cuenta". |
| Administrador | Todo lo anterior + panel de administración: crear, editar y eliminar productos. |

Los permisos se validan **en el servidor** (middleware `requiereAuth` + `requiereRol`). Lo que se oculta en el frontend es solo comodidad.

## Arrancar

```bash
npm install
cp server/.env.example server/.env   # y cambia JWT_SECRET
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

La primera vez se crea la base de datos `server/data/tienda.db` con productos de ejemplo y la cuenta de administrador definida en `server/.env`.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Levanta API y web a la vez |
| `npm test` | Pruebas de la API (Vitest + Supertest) |
| `npm run typecheck` | Revisa los tipos de servidor y cliente |

## Producción y despliegue

```bash
npm run build   # compila el frontend en client/dist
npm start       # un solo servidor: API en /api y la web en el resto de rutas
```

En Render se despliega con el blueprint [`render.yaml`](render.yaml) (New → Blueprint → este repositorio).
En el plan gratuito el disco no es persistente: la base de datos vuelve a los datos de ejemplo en cada reinicio.

## Estructura

```
server/   Express + SQLite (node:sqlite) + JWT + Zod
  src/db.ts             esquema y datos de ejemplo
  src/auth.ts           tokens y middlewares de rol
  src/rutas/            endpoints /api/auth y /api/productos
  test/api.test.ts      pruebas de permisos y CRUD
client/   React + Vite + React Router
  src/auth.tsx          sesión y rutas protegidas
  src/paginas/          catálogo, detalle, login, registro, paneles
```

## API

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/api/auth/registro` | público (siempre crea un cliente) |
| POST | `/api/auth/login` | público |
| GET | `/api/auth/yo` | sesión iniciada |
| GET | `/api/productos?categoria=&q=` | público |
| GET | `/api/productos/:id` | público |
| POST / PUT / DELETE | `/api/productos[/:id]` | solo admin |

## Ideas para seguir

- Carrito de compras y pedidos (tablas nuevas: `pedidos`, `items_pedido`).
- Subir imágenes en lugar de pegar una URL.
- Paginación del catálogo.
- Gestión de usuarios desde el panel admin.
