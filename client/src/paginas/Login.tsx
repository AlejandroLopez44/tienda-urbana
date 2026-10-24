import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth';

export function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const desde = (useLocation().state as { desde?: string } | null)?.desde;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const usuario = await iniciarSesion(email, password);
      navegar(desde ?? (usuario.rol === 'admin' ? '/admin' : '/mi-cuenta'), { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario formulario-chico" onSubmit={enviar}>
      <h1>Entrar</h1>
      {error && <p className="alerta">{error}</p>}
      <label>
        Email
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Contraseña
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button className="boton boton-ancho" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
      <p className="tenue">
        ¿No tienes cuenta? <Link to="/registro">Créala aquí</Link>
      </p>
    </form>
  );
}
