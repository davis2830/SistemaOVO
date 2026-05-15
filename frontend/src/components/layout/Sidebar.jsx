import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Box, Typography, Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory2 as CatalogIcon,
  Warehouse as WarehouseIcon,
  LocalShipping as PurchaseIcon,
  People as ClientsIcon,
  AccountBalance as CreditsIcon,
  ShoppingCart as SalesIcon,
  Receipt as BillingIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const MENU_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Catálogo', path: '/catalog', icon: <CatalogIcon /> },
  { label: 'Inventario', path: '/inventory', icon: <WarehouseIcon /> },
  { label: 'Compras', path: '/purchases', icon: <PurchaseIcon /> },
  { label: 'Clientes', path: '/clients', icon: <ClientsIcon /> },
  { label: 'Créditos', path: '/credits', icon: <CreditsIcon /> },
  { label: 'Ventas', path: '/sales', icon: <SalesIcon /> },
  { label: 'Facturación', path: '/billing', icon: <BillingIcon /> },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" color="primary" noWrap>SistemaOVO</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {MENU_ITEMS.map(({ label, path, icon }) => (
          <ListItemButton
            key={path}
            selected={isActive(path)}
            onClick={() => navigate(path)}
            sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
