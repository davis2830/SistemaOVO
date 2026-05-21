import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import { Input, Select, Textarea, Tabs, Alert } from '../../components/common/FormField';
import useCrud from '../../hooks/useCrud';
import { suppliersAPI, purchaseEntriesAPI, warehousesAPI, productsAPI } from '../../api/endpoints';

const SUP_COLUMNS = [
  { field: 'nit', headerName: 'NIT', width: 120 },
  { field: 'name', headerName: 'Nombre' },
  { field: 'trade_name', headerName: 'Nombre Comercial' },
  { field: 'phone', headerName: 'Teléfono' },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

const ENTRY_COLUMNS = [
  { field: 'entry_number', headerName: '# Entrada', width: 140 },
  { field: 'supplier_name', headerName: 'Proveedor' },
  { field: 'warehouse_name', headerName: 'Bodega' },
  { field: 'entry_date', headerName: 'Fecha' },
  { field: 'total_cost', headerName: 'Costo Total', render: (r) => `Q ${Number(r.total_cost).toFixed(2)}` },
  { field: 'status', headerName: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
];

const EMPTY_SUP = { nit: '', name: '', trade_name: '', address: '', phone: '', email: '', contact_person: '', notes: '' };
const EMPTY_ITEM = { product: '', quantity_received: '', unit_cost: '', expiry_date: '' };

export default function PurchasesPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const suppliers = useCrud(suppliersAPI);
  const entries = useCrud(purchaseEntriesAPI);
  const warehouses = useCrud(warehousesAPI);
  const products = useCrud(productsAPI);

  const [supModal, setSupModal] = useState(false);
  const [supEditing, setSupEditing] = useState(null);
  const [supForm, setSupForm] = useState(EMPTY_SUP);
  const [supDelete, setSupDelete] = useState(null);

  const [entryModal, setEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState({ supplier: '', warehouse: '', entry_date: '', notes: '' });
  const [entryItems, setEntryItems] = useState([{ ...EMPTY_ITEM }]);
  const [entryError, setEntryError] = useState('');

  const [detailModal, setDetailModal] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);

  const [saving, setSaving] = useState(false);

  const openSupCreate = () => { setSupEditing(null); setSupForm(EMPTY_SUP); setSupModal(true); };
  const openSupEdit = (r) => {
    setSupEditing(r);
    setSupForm({ nit: r.nit, name: r.name, trade_name: r.trade_name || '', address: r.address || '', phone: r.phone || '', email: r.email || '', contact_person: r.contact_person || '', notes: r.notes || '' });
    setSupModal(true);
  };
  const submitSup = async () => {
    setSaving(true);
    try {
      if (supEditing) await suppliers.handleUpdate(supEditing.id, supForm);
      else await suppliers.handleCreate(supForm);
      setSupModal(false);
    } catch {}
    setSaving(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const openEntryCreate = () => {
    setEntryForm({ supplier: '', warehouse: '', entry_date: today, notes: '' });
    setEntryItems([{ ...EMPTY_ITEM }]);
    setEntryError('');
    setEntryModal(true);
  };
  const addItem = () => setEntryItems([...entryItems, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setEntryItems(entryItems.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const items = [...entryItems];
    items[i] = { ...items[i], [field]: value };
    setEntryItems(items);
  };

  const submitEntry = async () => {
    setEntryError('');
    if (!entryForm.supplier || !entryForm.warehouse || !entryForm.entry_date) {
      setEntryError('Seleccione proveedor, bodega y fecha.');
      return;
    }
    const validItems = entryItems.filter((it) => it.product && it.quantity_received && it.unit_cost);
    if (validItems.length === 0) {
      setEntryError('Agregue al menos una línea con producto, cantidad y costo.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        supplier: entryForm.supplier,
        warehouse: entryForm.warehouse,
        entry_date: entryForm.entry_date,
        notes: entryForm.notes || '',
        items: validItems.map((it) => ({
          product: it.product,
          quantity_received: parseFloat(it.quantity_received),
          unit_cost: parseFloat(it.unit_cost),
          expiry_date: it.expiry_date || null,
        })),
      };
      await purchaseEntriesAPI.create(payload);
      entries.refresh();
      setEntryModal(false);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error?.message || data?.detail || JSON.stringify(data) || 'Error al crear la entrada.';
      setEntryError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    setSaving(false);
  };

  const viewEntry = (r) => { setDetailEntry(r); setDetailModal(true); };

  const filter = (rows) => rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Compras"
        onAdd={tab === 0 ? openSupCreate : openEntryCreate}
        addLabel={tab === 0 ? 'Nuevo Proveedor' : 'Nueva Entrada'}
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <Tabs tabs={['Proveedores', 'Entradas de Compra']} active={tab} onChange={setTab} />

      {tab === 0 && (
        <>
          <DataTable columns={SUP_COLUMNS} rows={filter(suppliers.rows)} loading={suppliers.loading}
            onEdit={openSupEdit} onDelete={(r) => setSupDelete(r)} />
          <FormModal open={supModal} onClose={() => setSupModal(false)} onSubmit={submitSup}
            title={supEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'} loading={saving}>
            <div className="space-y-4">
              <Input label="NIT" required value={supForm.nit} onChange={(e) => setSupForm({ ...supForm, nit: e.target.value })} />
              <Input label="Nombre / Razón Social" required value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} />
              <Input label="Nombre Comercial" value={supForm.trade_name} onChange={(e) => setSupForm({ ...supForm, trade_name: e.target.value })} />
              <Input label="Dirección" value={supForm.address} onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} />
                <Input label="Email" value={supForm.email} onChange={(e) => setSupForm({ ...supForm, email: e.target.value })} />
              </div>
              <Input label="Persona de Contacto" value={supForm.contact_person} onChange={(e) => setSupForm({ ...supForm, contact_person: e.target.value })} />
              <Textarea label="Notas" value={supForm.notes} onChange={(e) => setSupForm({ ...supForm, notes: e.target.value })} />
            </div>
          </FormModal>
          <ConfirmDialog open={!!supDelete} onClose={() => setSupDelete(null)}
            onConfirm={async () => { await suppliers.handleDelete(supDelete.id); setSupDelete(null); }}
            title="Eliminar Proveedor" message={`¿Eliminar "${supDelete?.name}"?`} />
        </>
      )}

      {tab === 1 && (
        <>
          <DataTable columns={ENTRY_COLUMNS} rows={filter(entries.rows)} loading={entries.loading}
            onView={viewEntry} />

          <FormModal open={entryModal} onClose={() => setEntryModal(false)} onSubmit={submitEntry}
            title="Nueva Entrada de Compra" loading={saving} maxWidth="lg">
            <div className="space-y-4">
              {entryError && <Alert>{entryError}</Alert>}
              <div className="grid grid-cols-3 gap-4">
                <Select label="Proveedor" required value={entryForm.supplier}
                  onChange={(e) => setEntryForm({ ...entryForm, supplier: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  {suppliers.rows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
                <Select label="Bodega" required value={entryForm.warehouse}
                  onChange={(e) => setEntryForm({ ...entryForm, warehouse: e.target.value })}>
                  <option value="">— Seleccionar —</option>
                  {warehouses.rows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </Select>
                <Input label="Fecha" required type="date" value={entryForm.entry_date}
                  onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })} />
              </div>
              <Input label="Notas" value={entryForm.notes}
                onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} />

              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-charcoal">Líneas de Compra</h4>
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
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Cantidad</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Costo Unitario</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Vencimiento</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entryItems.map((item, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <select className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                            value={item.product} onChange={(e) => updateItem(i, 'product', e.target.value)}>
                            <option value="">— Producto —</option>
                            {products.rows.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                            value={item.quantity_received} onChange={(e) => updateItem(i, 'quantity_received', e.target.value)}
                            placeholder="0" min="1" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" step="0.01" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                            value={item.unit_cost} onChange={(e) => updateItem(i, 'unit_cost', e.target.value)}
                            placeholder="0.00" min="0" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="date" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yolk"
                            value={item.expiry_date} onChange={(e) => updateItem(i, 'expiry_date', e.target.value)} />
                        </td>
                        <td className="px-3 py-2">
                          {entryItems.length > 1 && (
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
            title={`Entrada ${detailEntry?.entry_number || ''}`} submitLabel="" maxWidth="md">
            {detailEntry && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="text-xs text-gray-400">Proveedor</span><p className="font-semibold">{detailEntry.supplier_name}</p></div>
                  <div><span className="text-xs text-gray-400">Bodega</span><p className="font-semibold">{detailEntry.warehouse_name}</p></div>
                  <div><span className="text-xs text-gray-400">Fecha</span><p className="font-semibold">{detailEntry.entry_date}</p></div>
                  <div><span className="text-xs text-gray-400">Costo Total</span><p className="font-semibold">Q {Number(detailEntry.total_cost).toFixed(2)}</p></div>
                </div>
                {detailEntry.items?.length > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-eggshell">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Producto</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Cantidad</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Costo Unit.</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Subtotal</th>
                      </tr></thead>
                      <tbody>
                        {detailEntry.items.map((it, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-2">{it.product_name || it.product}</td>
                            <td className="px-3 py-2">{it.quantity_received}</td>
                            <td className="px-3 py-2">Q {Number(it.unit_cost).toFixed(2)}</td>
                            <td className="px-3 py-2">Q {(it.quantity_received * it.unit_cost).toFixed(2)}</td>
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
      )}
    </>
  );
}
