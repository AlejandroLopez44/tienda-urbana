import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ErrorApi } from '../api';
import { useAuth } from '../auth';

export function Registro() {
  const { registrarse } = useAuth();
  const navegar = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await registrarse(nombre, email, password);
      navegar('/mi-cuenta', { replace: true });
    } catch (err) {
      const detalle = err instanceof ErrorApi ? err.detalles[0]?.mensaje : undefined;
      setError(detalle ? `${(err as Error).message}: ${detalle}` : (err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario formulario-chico" onSubmit={enviar}>
      <h1>Crear cuenta</h1>
      {error && <p className="alerta">{error}</p>}
      <label>
        Nombre
        <input required minLength={2} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </label>
      <label>
        Email
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Contraseña <span className="tenue">(mínimo 8 caracteres)</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button className="boton boton-ancho" disabled={enviando}>
        {enviando ? 'Creando…' : 'Crear cuenta'}
      </button>
      <p className="tenue">
        ¿Ya tienes cuenta? <Link to="/login">Entra aquí</Link>
      </p>
    </form>
  );
}
