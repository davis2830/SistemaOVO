import { useState } from 'react';
import {
  Box, TextField, MenuItem, Typography, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
} from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import useCrud from '../../hooks/useCrud';
import { invoicesAPI, salesOrdersAPI } from '../../api/endpoints';

const COLUMNS = [
  { field: 'invoice_number', headerName: '# Factura', width: 140 },
  { field: 'order_number', headerName: '# Pedido' },
  { field: 'client_name', headerName: 'Cliente' },
  { field: 'client_nit', headerName: 'NIT' },
  { field: 'total', headerName: 'Total', render: (r) => `Q ${Number(r.total).toFixed(2)}` },
  { field: 'status', headerName: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
  { field: 'fel_uuid', headerName: 'FEL UUID', render: (r) => r.fel_uuid || '—' },
  { field: 'invoice_date', headerName: 'Fecha', render: (r) => r.invoice_date || r.created_at?.split('T')[0] },
];

export default function BillingPage() {
  const [search, setSearch] = useState('');
  const invoices = useCrud(invoicesAPI);
  const orders = useCrud(salesOrdersAPI);

  // Create invoice from order
  const [createModal, setCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');

  // Cancel invoice
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelInvoice, setCancelInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Detail view
  const [detailModal, setDetailModal] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const deliveredOrders = orders.rows.filter((o) => o.status === 'DELIVERED');

  const openCreate = () => { setSelectedOrder(''); setError(''); setCreateModal(true); };
  const submitCreate = async () => {
    setSaving(true); setError('');
    try {
      await invoicesAPI.create({ sales_order: selectedOrder });
      invoices.refresh();
      orders.refresh();
      setCreateModal(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Error al crear factura');
    }
    setSaving(false);
  };

  const doCertify = async (inv) => {
    try {
      await invoicesAPI.certify(inv.id);
      invoices.refresh();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Error al certificar');
    }
  };

  const openCancel = (inv) => { setCancelInvoice(inv); setCancelReason(''); setError(''); setCancelModal(true); };
  const submitCancel = async () => {
    setSaving(true); setError('');
    try {
      await invoicesAPI.cancel(cancelInvoice.id, { reason: cancelReason });
      invoices.refresh();
      setCancelModal(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg) || 'Error al anular');
    }
    setSaving(false);
  };

  const viewInvoice = (r) => { setDetailInvoice(r); setDetailModal(true); };

  const filter = (rows) => rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Facturación" onAdd={openCreate} addLabel="Crear Factura">
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataTable columns={COLUMNS} rows={filter(invoices.rows)} loading={invoices.loading}
        onView={viewInvoice}
        actions={[
          { label: 'Certificar FEL', color: 'primary', onClick: doCertify, show: (r) => r.status === 'DRAFT' },
          { label: 'Anular', color: 'error', onClick: openCancel, show: (r) => r.status === 'CERTIFIED' },
        ]}
      />

      {/* ── Create invoice from order ── */}
      <FormModal open={createModal} onClose={() => setCreateModal(false)} onSubmit={submitCreate}
        title="Crear Factura desde Pedido" loading={saving}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {deliveredOrders.length === 0 ? (
            <Alert severity="info">No hay pedidos entregados (DELIVERED) disponibles para facturar.</Alert>
          ) : (
            <TextField label="Pedido Entregado *" select value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)} fullWidth>
              {deliveredOrders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.order_number} — {o.client_name} — Q {Number(o.total).toFixed(2)}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Box>
      </FormModal>

      {/* ── Cancel invoice ── */}
      <FormModal open={cancelModal} onClose={() => setCancelModal(false)} onSubmit={submitCancel}
        title={`Anular Factura ${cancelInvoice?.invoice_number || ''}`} loading={saving} submitLabel="Anular">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Motivo de Anulación *" value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)} fullWidth multiline rows={3}
            helperText="Mínimo 10 caracteres" />
        </Box>
      </FormModal>

      {/* ── Detail modal ── */}
      <FormModal open={detailModal} onClose={() => setDetailModal(false)}
        title={`Factura ${detailInvoice?.invoice_number || ''}`} submitLabel=""
        onSubmit={() => setDetailModal(false)} maxWidth="md">
        {detailInvoice && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
              <Box>
                <Typography variant="body2"><strong>Cliente:</strong> {detailInvoice.client_name}</Typography>
                <Typography variant="body2"><strong>NIT:</strong> {detailInvoice.client_nit}</Typography>
                <Typography variant="body2"><strong>Pedido:</strong> {detailInvoice.order_number}</Typography>
              </Box>
              <Box>
                <Typography variant="body2"><strong>Estado:</strong> <StatusBadge status={detailInvoice.status} /></Typography>
                <Typography variant="body2"><strong>Total:</strong> Q {Number(detailInvoice.total).toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Tipo:</strong> {detailInvoice.document_type_display}</Typography>
              </Box>
              {detailInvoice.fel_uuid && (
                <Box>
                  <Typography variant="body2"><strong>FEL UUID:</strong> {detailInvoice.fel_uuid}</Typography>
                  <Typography variant="body2"><strong>FEL Serie:</strong> {detailInvoice.fel_series}</Typography>
                  <Typography variant="body2"><strong>FEL Número:</strong> {detailInvoice.fel_number}</Typography>
                </Box>
              )}
            </Box>
            {detailInvoice.items?.length > 0 && (
              <Paper variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Unidad</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Precio Unit.</TableCell>
                      <TableCell>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailInvoice.items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.product_code}</TableCell>
                        <TableCell>{it.description}</TableCell>
                        <TableCell>{it.display_unit}</TableCell>
                        <TableCell>{it.display_qty}</TableCell>
                        <TableCell>Q {Number(it.unit_price).toFixed(4)}</TableCell>
                        <TableCell>Q {Number(it.subtotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
            {detailInvoice.cancel_reason && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Anulada:</strong> {detailInvoice.cancel_reason}
              </Alert>
            )}
          </Box>
        )}
      </FormModal>
    </>
  );
}
