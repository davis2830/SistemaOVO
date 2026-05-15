import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: 'background.default',
    }}>
      <Card sx={{ width: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>SistemaOVO</Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Sistema de Gestión de Ventas de Huevos
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Correo electrónico" type="email" fullWidth
              value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }} required autoFocus
            />
            <TextField
              label="Contraseña" type="password" fullWidth
              value={password} onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }} required
            />
            <Button
              type="submit" variant="contained" fullWidth size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : null}
            >
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
