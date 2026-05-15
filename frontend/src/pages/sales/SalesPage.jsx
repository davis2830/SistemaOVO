import { useState } from 'react';
import {
  Box, TextField, MenuItem, Button, IconButton, Typography, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Paper, Chip,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import useCrud from '../../hooks/useCrud';
import { salesOrdersAPI, clientsAPI, warehousesAPI, productsAPI, deliveryRoutesAPI } from '../../api/endpoints';

const COLUMNS = [
  { field: 'order_number', headerName: '# Pedido', width: 140 },
  { field: 'client_name', headerName: 'Cliente' },
  { field: 'warehouse_name', headerName: 'Bodega' },
  { field: 'payment_type', headerName: 'Tipo Pago' },
  { field: 'total', headerName: 'Total', render: (r) => `Q ${Number(r.total).toFixed(2)}` },
  { field: 'status', headerName: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
  { field: 'order_date', headerName: 'Fecha' },
];

const UNITS = ['UNIDAD', 'CARTON', 'CAJA'];
const PAYMENT_TYPES = ['CONTADO', 'CREDITO'];
const EMPTY_ITEM = { product: '', display_unit: 'UNIDAD', display_qty: '', unit_price: '', discount_pct: '0' };

const TRANSITIONS = {
  DRAFT: [{ action: 'confirm', label: 'Confirmar', color: 'primary' }, { action: 'cancel', label: 'Anular', color: 'error' }],
  CONFIRMED: [{ action: 'dispatch', label: 'Despachar', color: 'info' }, { action: 'cancel', label: 'Anular', color: 'error' }],
  DISPATCHED: [{ action: 'deliver', label: 'Entregar', color: 'success' }],
};

export default function SalesPage() {
  const [search, setSearch] = useState('');
  const orders = useCrud(salesOrdersAPI);
  const clients = useCrud(clientsAPI);
  const warehouses = useCrud(warehousesAPI);
  const products = useCrud(productsAPI);
  const routes = useCrud(deliveryRoutesAPI);

  const [orderModal, setOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    client: '', warehouse: '', delivery_route: '', payment_type: 'CONTADO',
    order_date: '', delivery_date: '', discount: '0', notes: '',
  });
  const [orderItems, setOrderItems] = useState([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Detail view
  const [detailModal, setDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const openCreate = () => {
    setOrderForm({
      client: '', warehouse: '', delivery_route: '', payment_type: 'CONTADO',
      order_date: today, delivery_date: '', discount: '0', notes: '',
    });
    setOrderItems([{ ...EMPTY_ITEM }]);
    setError('');
    setOrderModal(true);
  };

  const addItem = () => setOrderItems([...orderItems, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setOrderItems(orderItems.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const items = [...orderItems];
    items[i] = { ...items[i], [field]: value };
    setOrderItems(items);
  };

  const submitOrder = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        client: orderForm.client,
        warehouse: orderForm.warehouse,
        delivery_route: orderForm.delivery_route || null,
        payment_type: orderForm.payment_type,
        order_date: orderForm.order_date,
        delivery_date: orderForm.delivery_date || null,
        discount: parseFloat(orderForm.discount) || 0,
        notes: orderForm.notes,
        items: orderItems.map((it) => ({
          product: it.product,
          display_unit: it.display_unit,
          display_qty: parseFloat(it.display_qty),
          unit_price: parseFloat(it.unit_price),
          discount_pct: parseFloat(it.discount_pct) || 0,
        })),
      };
      await salesOrdersAPI.create(payload);
      orders.refresh();
      setOrderModal(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Error al crear pedido');
    }
    setSaving(false);
  };

  const doTransition = async (order, action) => {
    try {
      await salesOrdersAPI.transition(order.id, { action });
      orders.refresh();
    } catch (err) {
      alert(err.response?.data?.error?.message || `Error al ${action}`);
    }
  };

  const viewOrder = (r) => { setDetailOrder(r); setDetailModal(true); };

  const filter = (rows) => rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Ventas" onAdd={openCreate} addLabel="Nuevo Pedido">
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataTable columns={COLUMNS} rows={filter(orders.rows)} loading={orders.loading}
        onView={viewOrder}
        actions={Object.entries(TRANSITIONS).flatMap(([status, actions]) =>
          actions.map((a) => ({
            label: a.label, color: a.color,
            onClick: (r) => doTransition(r, a.action),
            show: (r) => r.status === status,
          }))
        )}
      />

      {/* ── Create order modal ── */}
      <FormModal open={orderModal} onClose={() => setOrderModal(false)} onSubmit={submitOrder}
        title="Nuevo Pedido de Venta" loading={saving} maxWidth="md">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Cliente *" select value={orderForm.client}
              onChange={(e) => setOrderForm({ ...orderForm, client: e.target.value })} fullWidth>
              {clients.rows.map((c) => <MenuItem key={c.id} value={c.id}>{c.nit} — {c.name}</MenuItem>)}
            </TextField>
            <TextField label="Bodega *" select value={orderForm.warehouse}
              onChange={(e) => setOrderForm({ ...orderForm, warehouse: e.target.value })} fullWidth>
              {warehouses.rows.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Tipo de Pago" select value={orderForm.payment_type}
              onChange={(e) => setOrderForm({ ...orderForm, payment_type: e.target.value })} fullWidth>
              {PAYMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Ruta de Entrega" select value={orderForm.delivery_route}
              onChange={(e) => setOrderForm({ ...orderForm, delivery_route: e.target.value })} fullWidth>
              <MenuItem value="">Sin ruta</MenuItem>
              {routes.rows.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
            </TextField>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Fecha Pedido *" type="date" value={orderForm.order_date}
              onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })}
              InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Fecha Entrega" type="date" value={orderForm.delivery_date}
              onChange={(e) => setOrderForm({ ...orderForm, delivery_date: e.target.value })}
              InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Descuento (Q)" type="number" value={orderForm.discount}
              onChange={(e) => setOrderForm({ ...orderForm, discount: e.target.value })} fullWidth />
          </Box>
          <TextField label="Notas" value={orderForm.notes}
            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} fullWidth />

          <Typography variant="subtitle1" sx={{ mt: 1 }}>Líneas del Pedido</Typography>
          <Paper variant="outlined" sx={{ overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Unidad</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Precio Unitario</TableCell>
                  <TableCell>Desc %</TableCell>
                  <TableCell width={50}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderItems.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <TextField select size="small" fullWidth value={item.product}
                        onChange={(e) => updateItem(i, 'product', e.target.value)}>
                        {products.rows.map((p) => <MenuItem key={p.id} value={p.id}>{p.code} — {p.name}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField select size="small" value={item.display_unit}
                        onChange={(e) => updateItem(i, 'display_unit', e.target.value)}>
                        {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={item.display_qty}
                        onChange={(e) => updateItem(i, 'display_qty', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={item.unit_price}
                        onChange={(e) => updateItem(i, 'unit_price', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={item.discount_pct}
                        onChange={(e) => updateItem(i, 'discount_pct', e.target.value)} />
                    </TableCell>
                    <TableCell>
                      {orderItems.length > 1 && (
                        <IconButton size="small" onClick={() => removeItem(i)}><Delete fontSize="small" /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Button size="small" startIcon={<Add />} onClick={addItem}>Agregar Línea</Button>
        </Box>
      </FormModal>

      {/* ── Detail modal ── */}
      <FormModal open={detailModal} onClose={() => setDetailModal(false)}
        title={`Pedido ${detailOrder?.order_number || ''}`} submitLabel=""
        onSubmit={() => setDetailModal(false)} maxWidth="md">
        {detailOrder && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
              <Box>
                <Typography variant="body2"><strong>Cliente:</strong> {detailOrder.client_name}</Typography>
                <Typography variant="body2"><strong>NIT:</strong> {detailOrder.client_nit}</Typography>
                <Typography variant="body2"><strong>Bodega:</strong> {detailOrder.warehouse_name}</Typography>
              </Box>
              <Box>
                <Typography variant="body2"><strong>Tipo Pago:</strong> {detailOrder.payment_type}</Typography>
                <Typography variant="body2"><strong>Fecha:</strong> {detailOrder.order_date}</Typography>
                <Typography variant="body2"><strong>Estado:</strong> <StatusBadge status={detailOrder.status} /></Typography>
              </Box>
              <Box>
                <Typography variant="body2"><strong>Subtotal:</strong> Q {Number(detailOrder.subtotal).toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Descuento:</strong> Q {Number(detailOrder.discount).toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Total:</strong> Q {Number(detailOrder.total).toFixed(2)}</Typography>
              </Box>
            </Box>
            {detailOrder.items?.length > 0 && (
              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Unidad</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Precio Unitario</TableCell>
                      <TableCell>Desc %</TableCell>
                      <TableCell>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailOrder.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.product_name || it.product_code}</TableCell>
                        <TableCell>{it.display_unit}</TableCell>
                        <TableCell>{it.display_qty}</TableCell>
                        <TableCell>Q {Number(it.unit_price).toFixed(4)}</TableCell>
                        <TableCell>{it.discount_pct}%</TableCell>
                        <TableCell>Q {Number(it.subtotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        )}
      </FormModal>
    </>
  );
}
