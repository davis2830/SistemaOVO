import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import { Input, Select, Textarea, Alert } from '../../components/common/FormField';
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

  const [createModal, setCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelInvoice, setCancelInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [detailModal, setDetailModal] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const deliveredOrders = orders.rows.filter((o) => o.status === 'DELIVERED');

  const openCreate = () => { setSelectedOrder(''); setError(''); setCreateModal(true); };
  const submitCreate = async () => {
    if (!selectedOrder) { setError('Seleccione un pedido entregado.'); return; }
    setSaving(true); setError('');
    try {
      await invoicesAPI.create({ sales_order: selectedOrder });
      invoices.refresh();
      orders.refresh();
      setCreateModal(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Error al crear factura';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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
    if (!cancelReason.trim()) { setError('Ingrese el motivo de anulación.'); return; }
    setSaving(true); setError('');
    try {
      await invoicesAPI.cancel(cancelInvoice.id, { reason: cancelReason });
      invoices.refresh();
      setCancelModal(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Error al anular';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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
          { label: 'Certificar FEL', onClick: doCertify, show: (r) => r.status === 'DRAFT' },
          { label: 'Anular', color: 'error', onClick: openCancel, show: (r) => r.status === 'CERTIFIED' },
        ]}
      />

      <FormModal open={createModal} onClose={() => setCreateModal(false)} onSubmit={submitCreate}
        title="Crear Factura desde Pedido" loading={saving}>
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          {deliveredOrders.length === 0 ? (
            <Alert type="info">No hay pedidos entregados (DELIVERED) disponibles para facturar.</Alert>
          ) : (
            <Select label="Pedido Entregado" required value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {deliveredOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} — {o.client_name} — Q {Number(o.total).toFixed(2)}
                </option>
              ))}
            </Select>
          )}
        </div>
      </FormModal>

      <FormModal open={cancelModal} onClose={() => setCancelModal(false)} onSubmit={submitCancel}
        title={`Anular Factura ${cancelInvoice?.invoice_number || ''}`} loading={saving} submitLabel="Anular">
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Textarea label="Motivo de Anulación" required value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)} rows={3} />
        </div>
      </FormModal>

      <FormModal open={detailModal} onClose={() => setDetailModal(false)}
        title={`Factura ${detailInvoice?.invoice_number || ''}`} submitLabel="" maxWidth="md">
        {detailInvoice && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-400">Cliente</span><p className="font-semibold">{detailInvoice.client_name}</p></div>
              <div><span className="text-xs text-gray-400">NIT</span><p className="font-semibold">{detailInvoice.client_nit}</p></div>
              <div><span className="text-xs text-gray-400">Pedido</span><p className="font-semibold">{detailInvoice.order_number}</p></div>
              <div><span className="text-xs text-gray-400">Total</span><p className="font-semibold">Q {Number(detailInvoice.total).toFixed(2)}</p></div>
              <div><span className="text-xs text-gray-400">Estado</span><p><StatusBadge status={detailInvoice.status} /></p></div>
              <div><span className="text-xs text-gray-400">FEL UUID</span><p className="font-semibold text-sm break-all">{detailInvoice.fel_uuid || '—'}</p></div>
            </div>
            {detailInvoice.items?.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-sm">
                  <thead><tr className="bg-eggshell">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Producto</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Cantidad</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Precio Unit.</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                  </tr></thead>
                  <tbody>
                    {detailInvoice.items.map((it, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">{it.product_name || it.product || it.description}</td>
                        <td className="px-3 py-2">{it.quantity}</td>
                        <td className="px-3 py-2">Q {Number(it.unit_price).toFixed(2)}</td>
                        <td className="px-3 py-2">Q {Number(it.line_total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </FormModal>
    </>
  );
}
