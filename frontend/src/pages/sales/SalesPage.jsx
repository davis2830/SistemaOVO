import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import { Input, Select, Alert } from '../../components/common/FormField';
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
    setError('');
    if (!orderForm.client || !orderForm.warehouse || !orderForm.order_date) {
      setError('Seleccione cliente, bodega y fecha.');
      return;
    }
    const validItems = orderItems.filter((it) => it.product && it.display_qty && it.unit_price);
    if (validItems.length === 0) {
      setError('Agregue al menos una línea con producto, cantidad y precio.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        client: orderForm.client,
        warehouse: orderForm.warehouse,
        delivery_route: orderForm.delivery_route || null,
        payment_type: orderForm.payment_type,
        order_date: orderForm.order_date,
        delivery_date: orderForm.delivery_date || null,
        discount: parseFloat(orderForm.discount) || 0,
        notes: orderForm.notes || '',
        items: validItems.map((it) => ({
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
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Error al crear pedido';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
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

  const orderActions = Object.entries(TRANSITIONS).flatMap(([status, acts]) =>
    acts.map((a) => ({
      label: a.label,
      color: a.color === 'primary' ? undefined : a.color,
      show: (row) => row.status === status,
      onClick: (row) => doTransition(row, a.action),
    }))
  );

  return (
    <>
      <PageHeader title="Ventas" onAdd={openCreate} addLabel="Nuevo Pedido">
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <DataTable columns={COLUMNS} rows={filter(orders.rows)} loading={orders.loading}
        onView={viewOrder} actions={orderActions} />

      <FormModal open={orderModal} onClose={() => setOrderModal(false)} onSubmit={submitOrder}
        title="Nuevo Pedido de Venta" loading={saving} maxWidth="lg">
        <div className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid grid-cols-2 gap-4">
            <Select label="Cliente" required value={orderForm.client}
              onChange={(e) => setOrderForm({ ...orderForm, client: e.target.value })}>
              <option value="">— Seleccionar —</option>
              {clients.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Bodega" required value={orderForm.warehouse}
              onChange={(e) => setOrderForm({ ...orderForm, warehouse: e.target.value })}>
              <option value="">— Seleccionar —</option>
              {warehouses.rows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Tipo de Pago" value={orderForm.payment_type}
              onChange={(e) => setOrderForm({ ...orderForm, payment_type: e.target.value })}>
              {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input label="Fecha" required type="date" value={orderForm.order_date}
              onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })} />
            <Input label="Fecha Entrega" type="date" value={orderForm.delivery_date}
              onChange={(e) => setOrderForm({ ...orderForm, delivery_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Ruta de Entrega" value={orderForm.delivery_route}
              onChange={(e) => setOrderForm({ ...orderForm, delivery_route: e.target.value })}>
              <option value="">— Sin ruta —</option>
              {routes.rows.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <Input label="Descuento General" type="number" value={orderForm.discount}
              onChange={(e) => setOrderForm({ ...orderForm, discount: e.target.value })} min="0" step="0.01" />
          </div>
          <Input label="Notas" value={orderForm.notes}
            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} />

          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-charcoal">Líneas del Pedido</h4>
            <button onClick={addItem} className="text-xs font-semibold text-yolk hover:text-accent flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar línea
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-eggshell">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Producto</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Unidad</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Cantidad</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Precio Unit.</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Desc %</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <select className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                        value={item.product} onChange={(e) => updateItem(i, 'product', e.target.value)}>
                        <option value="">— Producto —</option>
                        {products.rows.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                        value={item.display_unit} onChange={(e) => updateItem(i, 'display_unit', e.target.value)}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="1" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                        value={item.display_qty} onChange={(e) => updateItem(i, 'display_qty', e.target.value)} placeholder="0" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.01" min="0" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                        value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} placeholder="0.00" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" max="100" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                        value={item.discount_pct} onChange={(e) => updateItem(i, 'discount_pct', e.target.value)} placeholder="0" />
                    </td>
                    <td className="px-3 py-2">
                      {orderItems.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </FormModal>

      <FormModal open={detailModal} onClose={() => setDetailModal(false)}
        title={`Pedido ${detailOrder?.order_number || ''}`} submitLabel="" maxWidth="md">
        {detailOrder && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-gray-400">Cliente</span><p className="font-semibold">{detailOrder.client_name}</p></div>
              <div><span className="text-xs text-gray-400">Bodega</span><p className="font-semibold">{detailOrder.warehouse_name}</p></div>
              <div><span className="text-xs text-gray-400">Fecha</span><p className="font-semibold">{detailOrder.order_date}</p></div>
              <div><span className="text-xs text-gray-400">Total</span><p className="font-semibold">Q {Number(detailOrder.total).toFixed(2)}</p></div>
              <div><span className="text-xs text-gray-400">Estado</span><p><StatusBadge status={detailOrder.status} /></p></div>
              <div><span className="text-xs text-gray-400">Tipo Pago</span><p className="font-semibold">{detailOrder.payment_type}</p></div>
            </div>
            {detailOrder.items?.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-sm">
                  <thead><tr className="bg-eggshell">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Producto</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Cantidad</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Precio Unit.</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Subtotal</th>
                  </tr></thead>
                  <tbody>
                    {detailOrder.items.map((it, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">{it.product_name || it.product}</td>
                        <td className="px-3 py-2">{it.display_qty} {it.display_unit}</td>
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
