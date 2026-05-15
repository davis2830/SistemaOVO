import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#f57c00' },
    success: { main: '#2e7d32' },
    warning: { main: '#ed6c02' },
    error: { main: '#d32f2f' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: '1px solid #e0e0e0' } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { '& .MuiTableCell-head': { fontWeight: 700, backgroundColor: '#f5f5f5' } },
      },
    },
  },
});

export default theme;
