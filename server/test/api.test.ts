import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../src/app';
import { abrirDb, sembrarDatos } from '../src/db';

const ADMIN = { nombre: 'Admin', email: 'admin@prueba.test', password: 'clave-admin-prueba' };
const CLIENTE = { nombre: 'Ana', email: 'ana@prueba.test', password: 'clave-cliente-prueba' };

const productoNuevo = {
  nombre: 'Chaleco "Prueba"',
  descripcion: 'Producto creado en las pruebas',
  precioCentavos: 3999,
  categoria: 'unisex',
  tallas: ['M', 'L'],
  stock: 5,
  imagenUrl: null,
};

let app: ReturnType<typeof crearApp>;

beforeEach(() => {
  // Cada prueba arranca con una base de datos nueva en memoria.
  const db = abrirDb(':memory:');
  sembrarDatos(db, ADMIN);
  app = crearApp(db, { jwtSecret: 'secreto-solo-para-pruebas' });
});

async function iniciarSesion(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.token;
}

async function tokenCliente(): Promise<string> {
  await request(app).post('/api/auth/registro').send(CLIENTE).expect(201);
  return iniciarSesion(CLIENTE.email, CLIENTE.password);
}

describe('catálogo público', () => {
  it('lista los productos sin iniciar sesión', async () => {
    const res = await request(app).get('/api/productos').expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('precioCentavos');
    expect(res.body.every((p: { imagenUrl: string }) => p.imagenUrl.startsWith('/productos/'))).toBe(true);
  });

  it('filtra por categoría y por texto', async () => {
    const mujer = await request(app).get('/api/productos?categoria=mujer').expect(200);
    expect(mujer.body.every((p: { categoria: string }) => p.categoria === 'mujer')).toBe(true);

    const busqueda = await request(app).get('/api/productos?q=hoodie').expect(200);
    expect(busqueda.body).toHaveLength(1);
  });

  it('responde 404 para un producto que no existe', async () => {
    await request(app).get('/api/productos/99999').expect(404);
  });
});

describe('autenticación', () => {
  it('el registro siempre crea un cliente, aunque se pida rol admin', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ ...CLIENTE, rol: 'admin' })
      .expect(201);
    expect(res.body.usuario.rol).toBe('cliente');
  });

  it('no permite registrar dos veces el mismo email', async () => {
    await request(app).post('/api/auth/registro').send(CLIENTE).expect(201);
    await request(app).post('/api/auth/registro').send({ ...CLIENTE, email: 'ANA@prueba.test' }).expect(409);
  });

  it('rechaza una contraseña incorrecta', async () => {
    await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: 'otra-clave' }).expect(401);
  });

  it('/yo devuelve el usuario de la sesión', async () => {
    const token = await iniciarSesion(ADMIN.email, ADMIN.password);
    const res = await request(app).get('/api/auth/yo').set('Authorization', `Bearer ${token}`).expect(200);
    expect(res.body).toMatchObject({ email: ADMIN.email, rol: 'admin' });
  });
});

describe('gestión de productos (permisos)', () => {
  it('sin sesión no se puede crear un producto', async () => {
    await request(app).post('/api/productos').send(productoNuevo).expect(401);
  });

  it('un cliente no puede crear, editar ni eliminar', async () => {
    const token = await tokenCliente();
    const auth = { Authorization: `Bearer ${token}` };
    await request(app).post('/api/productos').set(auth).send(productoNuevo).expect(403);
    await request(app).put('/api/productos/1').set(auth).send(productoNuevo).expect(403);
    await request(app).delete('/api/productos/1').set(auth).expect(403);
  });

  it('un token falsificado no sirve', async () => {
    await request(app).post('/api/productos').set('Authorization', 'Bearer token.falso.123').send(productoNuevo).expect(401);
  });
});

describe('gestión de productos (admin)', () => {
  it('crea, edita y elimina un producto', async () => {
    const token = await iniciarSesion(ADMIN.email, ADMIN.password);
    const auth = { Authorization: `Bearer ${token}` };

    const creado = await request(app).post('/api/productos').set(auth).send(productoNuevo).expect(201);
    expect(creado.body).toMatchObject({ nombre: productoNuevo.nombre, tallas: ['M', 'L'] });
    const id = creado.body.id;

    const editado = await request(app)
      .put(`/api/productos/${id}`)
      .set(auth)
      .send({ ...productoNuevo, precioCentavos: 2999, stock: 0 })
      .expect(200);
    expect(editado.body).toMatchObject({ precioCentavos: 2999, stock: 0 });

    await request(app).delete(`/api/productos/${id}`).set(auth).expect(204);
    await request(app).get(`/api/productos/${id}`).expect(404);
  });

  it('rechaza datos inválidos indicando el campo', async () => {
    const token = await iniciarSesion(ADMIN.email, ADMIN.password);
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productoNuevo, precioCentavos: -5, categoria: 'niños' })
      .expect(400);
    const campos = res.body.detalles.map((d: { campo: string }) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['precioCentavos', 'categoria']));
  });

  it('acepta imágenes https o rutas propias, pero no otros esquemas', async () => {
    const token = await iniciarSesion(ADMIN.email, ADMIN.password);
    const auth = { Authorization: `Bearer ${token}` };
    for (const imagenUrl of ['https://ejemplo.com/foto.jpg', '/productos/gorra-bloque.svg']) {
      await request(app).post('/api/productos').set(auth).send({ ...productoNuevo, imagenUrl }).expect(201);
    }
    await request(app).post('/api/productos').set(auth).send({ ...productoNuevo, imagenUrl: 'javascript:alert(1)' }).expect(400);
  });
});
