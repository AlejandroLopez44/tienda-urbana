import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ProveedorAuth, RutaProtegida } from './auth';
import { Layout } from './componentes/Layout';
import { Catalogo } from './paginas/Catalogo';
import { DetalleProducto } from './paginas/DetalleProducto';
import { Login } from './paginas/Login';
import { Registro } from './paginas/Registro';
import { PanelCliente } from './paginas/PanelCliente';
import { PanelAdmin } from './paginas/admin/PanelAdmin';
import { FormularioProducto } from './paginas/admin/FormularioProducto';
import './estilos.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorAuth>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Catalogo />} />
            <Route path="producto/:id" element={<DetalleProducto />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Registro />} />
            <Route path="mi-cuenta" element={<RutaProtegida><PanelCliente /></RutaProtegida>} />
            <Route path="admin" element={<RutaProtegida rol="admin"><PanelAdmin /></RutaProtegida>} />
            <Route path="admin/productos/nuevo" element={<RutaProtegida rol="admin"><FormularioProducto /></RutaProtegida>} />
            <Route path="admin/productos/:id/editar" element={<RutaProtegida rol="admin"><FormularioProducto /></RutaProtegida>} />
            <Route path="*" element={<p className="estado">Página no encontrada.</p>} />
          </Route>
        </Routes>
      </ProveedorAuth>
    </BrowserRouter>
  </StrictMode>,
);
