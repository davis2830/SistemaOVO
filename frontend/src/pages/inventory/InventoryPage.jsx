import { useState } from 'react';
import { Tabs, Tab, Box, TextField, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import useCrud from '../../hooks/useCrud';
import { warehousesAPI, batchesAPI, movementsAPI } from '../../api/endpoints';

const WH_COLUMNS = [
  { field: 'name', headerName: 'Nombre' },
  { field: 'address', headerName: 'Dirección' },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

const BATCH_COLUMNS = [
  { field: 'batch_number', headerName: 'Lote' },
  { field: 'product_name', headerName: 'Producto', render: (r) => r.product_name || r.product_code || '—' },
  { field: 'warehouse_name', headerName: 'Bodega', render: (r) => r.warehouse_name || '—' },
  { field: 'qty_remaining', headerName: 'Cantidad Restante' },
  { field: 'status', headerName: 'Estado', render: (r) => <StatusBadge status={r.status} /> },
  { field: 'entry_date', headerName: 'Fecha Entrada' },
];

const MOV_COLUMNS = [
  { field: 'movement_type', headerName: 'Tipo', render: (r) => <StatusBadge status={r.movement_type} /> },
  { field: 'quantity', headerName: 'Cantidad' },
  { field: 'batch_number', headerName: 'Lote', render: (r) => r.batch_number || '—' },
  { field: 'reference_type', headerName: 'Referencia' },
  { field: 'created_at', headerName: 'Fecha', render: (r) => new Date(r.created_at).toLocaleString() },
];

const EMPTY_WH = { name: '', address: '' };

export default function InventoryPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const warehouses = useCrud(warehousesAPI);
  const batches = useCrud(batchesAPI);
  const movements = useCrud(movementsAPI, { autoLoad: false });

  const [whModal, setWhModal] = useState(false);
  const [whEditing, setWhEditing] = useState(null);
  const [whForm, setWhForm] = useState(EMPTY_WH);
  const [saving, setSaving] = useState(false);

  const openWhCreate = () => { setWhEditing(null); setWhForm(EMPTY_WH); setWhModal(true); };
  const openWhEdit = (r) => { setWhEditing(r); setWhForm({ name: r.name, address: r.address || '' }); setWhModal(true); };

  const handleWhSubmit = async () => {
    setSaving(true);
    try {
      if (whEditing) await warehouses.handleUpdate(whEditing.id, whForm);
      else await warehouses.handleCreate(whForm);
      setWhModal(false);
    } catch {}
    setSaving(false);
  };

  const filter = (rows) => rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Inventario">
        <SearchBar value={search} onChange={setSearch} />
        {tab === 0 && (
          <Button variant="contained" startIcon={<Add />} onClick={openWhCreate}>
            Nueva Bodega
          </Button>
        )}
      </PageHeader>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); if (v === 2) movements.refresh(); }}>
          <Tab label="Bodegas" />
          <Tab label="Lotes" />
          <Tab label="Movimientos" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <>
          <DataTable columns={WH_COLUMNS} rows={filter(warehouses.rows)} loading={warehouses.loading}
            onEdit={openWhEdit} />
          <FormModal open={whModal} onClose={() => setWhModal(false)} onSubmit={handleWhSubmit}
            title={whEditing ? 'Editar Bodega' : 'Nueva Bodega'} loading={saving}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Nombre" value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} fullWidth required />
              <TextField label="Dirección" value={whForm.address} onChange={(e) => setWhForm({ ...whForm, address: e.target.value })} fullWidth />
            </Box>
          </FormModal>
        </>
      )}
      {tab === 1 && <DataTable columns={BATCH_COLUMNS} rows={filter(batches.rows)} loading={batches.loading} />}
      {tab === 2 && <DataTable columns={MOV_COLUMNS} rows={filter(movements.rows)} loading={movements.loading} />}
    </>
  );
}
