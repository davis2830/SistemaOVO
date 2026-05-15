import { useState, useEffect } from 'react';
import { Grid, Typography } from '@mui/material';
import {
  Inventory2, ShoppingCart, People, Receipt,
} from '@mui/icons-material';
import StatCard from '../../components/common/StatCard';
import { productsAPI, clientsAPI, salesOrdersAPI, invoicesAPI } from '../../api/endpoints';

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, clients: 0, orders: 0, invoices: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [prods, clients, orders, invs] = await Promise.allSettled([
          productsAPI.list(), clientsAPI.list(), salesOrdersAPI.list(), invoicesAPI.list(),
        ]);
        setStats({
          products: prods.status === 'fulfilled' ? (prods.value.data.data?.results || prods.value.data.results || []).length : 0,
          clients: clients.status === 'fulfilled' ? (clients.value.data.data?.results || clients.value.data.results || []).length : 0,
          orders: orders.status === 'fulfilled' ? (orders.value.data.data?.results || orders.value.data.results || []).length : 0,
          invoices: invs.status === 'fulfilled' ? (invs.value.data.data?.results || invs.value.data.results || []).length : 0,
        });
      } catch { /* ignore */ }
    };
    load();
  }, []);

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Productos" value={stats.products} icon={<Inventory2 fontSize="inherit" />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Clientes" value={stats.clients} icon={<People fontSize="inherit" />} color="secondary.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Pedidos" value={stats.orders} icon={<ShoppingCart fontSize="inherit" />} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Facturas" value={stats.invoices} icon={<Receipt fontSize="inherit" />} color="warning.main" />
        </Grid>
      </Grid>
    </>
  );
}
