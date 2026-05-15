import { useState, useEffect } from 'react';
import {
  Tabs, Tab, Box, TextField, MenuItem, Button, IconButton,
  Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
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

  // Supplier form
  const [supModal, setSupModal] = useState(false);
  const [supEditing, setSupEditing] = useState(null);
  const [supForm, setSupForm] = useState(EMPTY_SUP);
  const [supDelete, setSupDelete] = useState(null);

  // Purchase entry form
  const [entryModal, setEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState({ supplier: '', warehouse: '', entry_date: '', notes: '' });
  const [entryItems, setEntryItems] = useState([{ ...EMPTY_ITEM }]);

  // View entry detail
  const [detailModal, setDetailModal] = useState(false);
  const [detailEntry, setDetailEntry] = useState(null);

  const [saving, setSaving] = useState(false);

  // ── Supplier handlers ──
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

  // ── Entry handlers ──
  const today = new Date().toISOString().split('T')[0];
  const openEntryCreate = () => {
    setEntryForm({ supplier: '', warehouse: '', entry_date: today, notes: '' });
    setEntryItems([{ ...EMPTY_ITEM }]);
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
    setSaving(true);
    try {
      const payload = {
        supplier: entryForm.supplier,
        warehouse: entryForm.warehouse,
        entry_date: entryForm.entry_date,
        notes: entryForm.notes,
        items: entryItems.map((it) => ({
          product: it.product,
          quantity_received: parseFloat(it.quantity_received),
          unit_cost: parseFloat(it.unit_cost),
          expiry_date: it.expiry_date || null,
        })),
      };
      await purchaseEntriesAPI.create(payload);
      entries.refresh();
      setEntryModal(false);
    } catch {}
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Proveedores" />
          <Tab label="Entradas de Compra" />
        </Tabs>
      </Box>

      {/* ── Proveedores ── */}
      {tab === 0 && (
        <>
          <DataTable columns={SUP_COLUMNS} rows={filter(suppliers.rows)} loading={suppliers.loading}
            onEdit={openSupEdit} onDelete={(r) => setSupDelete(r)} />
          <FormModal open={supModal} onClose={() => setSupModal(false)} onSubmit={submitSup}
            title={supEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'} loading={saving}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="NIT *" value={supForm.nit} onChange={(e) => setSupForm({ ...supForm, nit: e.target.value })} fullWidth />
              <TextField label="Nombre / Razón Social *" value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} fullWidth />
              <TextField label="Nombre Comercial" value={supForm.trade_name} onChange={(e) => setSupForm({ ...supForm, trade_name: e.target.value })} fullWidth />
              <TextField label="Dirección" value={supForm.address} onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} fullWidth />
              <TextField label="Teléfono" value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} fullWidth />
              <TextField label="Email" value={supForm.email} onChange={(e) => setSupForm({ ...supForm, email: e.target.value })} fullWidth />
              <TextField label="Persona de Contacto" value={supForm.contact_person} onChange={(e) => setSupForm({ ...supForm, contact_person: e.target.value })} fullWidth />
              <TextField label="Notas" value={supForm.notes} onChange={(e) => setSupForm({ ...supForm, notes: e.target.value })} fullWidth multiline rows={2} />
            </Box>
          </FormModal>
          <ConfirmDialog open={!!supDelete} onClose={() => setSupDelete(null)}
            onConfirm={async () => { await suppliers.handleDelete(supDelete.id); setSupDelete(null); }}
            title="Eliminar Proveedor" message={`¿Eliminar "${supDelete?.name}"?`} />
        </>
      )}

      {/* ── Entradas de Compra ── */}
      {tab === 1 && (
        <>
          <DataTable columns={ENTRY_COLUMNS} rows={filter(entries.rows)} loading={entries.loading}
            onView={viewEntry} />
          <FormModal open={entryModal} onClose={() => setEntryModal(false)} onSubmit={submitEntry}
            title="Nueva Entrada de Compra" loading={saving} maxWidth="md">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Proveedor *" select value={entryForm.supplier}
                  onChange={(e) => setEntryForm({ ...entryForm, supplier: e.target.value })} fullWidth>
                  {suppliers.rows.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
                <TextField label="Bodega *" select value={entryForm.warehouse}
                  onChange={(e) => setEntryForm({ ...entryForm, warehouse: e.target.value })} fullWidth>
                  {warehouses.rows.map((w) => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </TextField>
                <TextField label="Fecha" type="date" value={entryForm.entry_date}
                  onChange={(e) => setEntryForm({ ...entryForm, entry_date: e.target.value })}
                  InputLabelProps={{ shrink: true }} fullWidth />
              </Box>
              <TextField label="Notas" value={entryForm.notes}
                onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} fullWidth />

              <Typography variant="subtitle1" sx={{ mt: 1 }}>Líneas de Compra</Typography>
              <Paper variant="outlined" sx={{ overflow: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Costo Unitario</TableCell>
                      <TableCell>Vencimiento</TableCell>
                      <TableCell width={50}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entryItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <TextField select size="small" fullWidth value={item.product}
                            onChange={(e) => updateItem(i, 'product', e.target.value)}>
                            {products.rows.map((p) => <MenuItem key={p.id} value={p.id}>{p.code} — {p.name}</MenuItem>)}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={item.quantity_received}
                            onChange={(e) => updateItem(i, 'quantity_received', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" type="number" value={item.unit_cost}
                            onChange={(e) => updateItem(i, 'unit_cost', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <TextField size="small" type="date" value={item.expiry_date}
                            onChange={(e) => updateItem(i, 'expiry_date', e.target.value)}
                            InputLabelProps={{ shrink: true }} />
                        </TableCell>
                        <TableCell>
                          {entryItems.length > 1 && (
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

          {/* Detail modal */}
          <FormModal open={detailModal} onClose={() => setDetailModal(false)}
            title={`Entrada ${detailEntry?.entry_number || ''}`} submitLabel="" maxWidth="md"
            onSubmit={() => setDetailModal(false)}>
            {detailEntry && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2"><strong>Proveedor:</strong> {detailEntry.supplier_name}</Typography>
                <Typography variant="body2"><strong>Bodega:</strong> {detailEntry.warehouse_name}</Typography>
                <Typography variant="body2"><strong>Fecha:</strong> {detailEntry.entry_date}</Typography>
                <Typography variant="body2"><strong>Total:</strong> Q {Number(detailEntry.total_cost).toFixed(2)}</Typography>
                {detailEntry.items?.length > 0 && (
                  <Paper variant="outlined" sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Producto</TableCell>
                          <TableCell>Cantidad</TableCell>
                          <TableCell>Costo Unitario</TableCell>
                          <TableCell>Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detailEntry.items.map((it) => (
                          <TableRow key={it.id}>
                            <TableCell>{it.product_name || it.product_code}</TableCell>
                            <TableCell>{it.quantity_received}</TableCell>
                            <TableCell>Q {Number(it.unit_cost).toFixed(4)}</TableCell>
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
      )}
    </>
  );
}
