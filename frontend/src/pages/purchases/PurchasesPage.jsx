import { useState } from 'react';
import { Tabs, Tab, Box, TextField } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import useCrud from '../../hooks/useCrud';
import { suppliersAPI, purchaseEntriesAPI } from '../../api/endpoints';

const SUPPLIER_COLUMNS = [
  { field: 'nit', headerName: 'NIT', width: 120 },
  { field: 'name', headerName: 'Nombre' },
  { field: 'trade_name', headerName: 'Nombre Comercial' },
  { field: 'phone', headerName: 'Teléfono' },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

const ENTRY_COLUMNS = [
  { field: 'entry_number', headerName: 'No. Entrada' },
  { field: 'supplier_name', headerName: 'Proveedor', render: (r) => r.supplier_name || '—' },
  { field: 'status', headerName: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
  { field: 'total_cost', headerName: 'Total', render: (r) => `Q${r.total_cost}` },
  { field: 'entry_date', headerName: 'Fecha' },
];

export default function PurchasesPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const suppliers = useCrud(suppliersAPI);
  const entries = useCrud(purchaseEntriesAPI);

  const [supModal, setSupModal] = useState(false);
  const [supForm, setSupForm] = useState({ nit: '', name: '', trade_name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const handleSupSubmit = async () => {
    setSaving(true);
    try { await suppliers.handleCreate(supForm); setSupModal(false); } catch {}
    setSaving(false);
  };

  const filtered = (tab === 0 ? suppliers.rows : entries.rows).filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Compras">
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Proveedores" />
          <Tab label="Entradas" />
        </Tabs>
      </Box>
      {tab === 0 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => { setSupForm({ nit: '', name: '', trade_name: '', phone: '', email: '' }); setSupModal(true); }}
              style={{ padding: '8px 16px', cursor: 'pointer' }}>+ Nuevo Proveedor</button>
          </Box>
          <DataTable columns={SUPPLIER_COLUMNS} rows={filtered} loading={suppliers.loading}
            onEdit={(r) => { setSupForm(r); setSupModal(true); }} />
          <FormModal open={supModal} onClose={() => setSupModal(false)} onSubmit={handleSupSubmit}
            title="Proveedor" loading={saving}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="NIT" value={supForm.nit} onChange={(e) => setSupForm({ ...supForm, nit: e.target.value })} required fullWidth />
              <TextField label="Nombre" value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} required fullWidth />
              <TextField label="Nombre Comercial" value={supForm.trade_name} onChange={(e) => setSupForm({ ...supForm, trade_name: e.target.value })} fullWidth />
              <TextField label="Teléfono" value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} fullWidth />
              <TextField label="Email" value={supForm.email} onChange={(e) => setSupForm({ ...supForm, email: e.target.value })} fullWidth />
            </Box>
          </FormModal>
        </>
      )}
      {tab === 1 && <DataTable columns={ENTRY_COLUMNS} rows={filtered} loading={entries.loading} />}
    </>
  );
}
