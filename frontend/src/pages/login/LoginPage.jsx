import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(typeof msg === 'string' ? msg : (msg?.non_field_errors?.[0] || 'Credenciales incorrectas.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-eggshell p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yolk rounded-xl flex items-center justify-center text-white shadow-lg shadow-yolk/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21c-4.418 0-8-4.03-8-9s3.582-9 8-9 8 4.03 8 9-3.582 9-8 9z" />
              </svg>
            </div>
            <h1 className="font-display font-extrabold text-3xl tracking-tight text-charcoal">
              Egg<span className="text-yolk">Tech</span>
            </h1>
          </div>
          <p className="text-gray-400 text-sm">Sistema de Gestión de Ventas de Huevos</p>
        </div>

        <div className="bg-white rounded-3xl shadow-premium border border-gray-50 p-8">
          <h2 className="text-xl font-display font-bold text-charcoal mb-6 text-center">Iniciar Sesión</h2>

          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-charcoal focus:outline-none focus:border-yolk focus:ring-1 focus:ring-yolk/30 transition-colors"
                placeholder="Ingrese su usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-charcoal focus:outline-none focus:border-yolk focus:ring-1 focus:ring-yolk/30 transition-colors"
                placeholder="Ingrese su contraseña"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-yolk text-charcoal font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />}
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
