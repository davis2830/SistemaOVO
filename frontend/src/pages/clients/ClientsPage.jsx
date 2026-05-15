import { useState } from 'react';
import { TextField, Box, MenuItem } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import useCrud from '../../hooks/useCrud';
import { clientsAPI } from '../../api/endpoints';

const COLUMNS = [
  { field: 'nit', headerName: 'NIT', width: 120 },
  { field: 'name', headerName: 'Nombre' },
  { field: 'client_type', headerName: 'Tipo' },
  { field: 'classification', headerName: 'Clasificación' },
  { field: 'phone', headerName: 'Teléfono' },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

const EMPTY_FORM = { nit: '', name: '', trade_name: '', address: '', phone: '', email: '', client_type: 'CONTADO', classification: 'MINORISTA' };

export default function ClientsPage() {
  const { rows, loading, handleCreate, handleUpdate, handleDelete } = useCrud(clientsAPI);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const filtered = rows.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.nit?.includes(search)
  );

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ nit: row.nit, name: row.name, trade_name: row.trade_name || '', address: row.address || '', phone: row.phone || '', email: row.email || '', client_type: row.client_type, classification: row.classification }); setModalOpen(true); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editing) await handleUpdate(editing.id, form);
      else await handleCreate(form);
      setModalOpen(false);
    } catch {}
    setSaving(false);
  };

  return (
    <>
      <PageHeader title="Clientes" onAdd={openCreate} addLabel="Nuevo Cliente">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre o NIT..." />
      </PageHeader>
      <DataTable columns={COLUMNS} rows={filtered} loading={loading}
        onEdit={openEdit} onDelete={(r) => setConfirmDelete(r)} />
      <FormModal open={modalOpen} onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit} title={editing ? 'Editar Cliente' : 'Nuevo Cliente'} loading={saving}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="NIT" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} required fullWidth />
          <TextField label="Nombre / Razón Social" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
          <TextField label="Nombre Comercial" value={form.trade_name} onChange={(e) => setForm({ ...form, trade_name: e.target.value })} fullWidth />
          <TextField label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth />
          <TextField label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          <TextField label="Tipo" select value={form.client_type} onChange={(e) => setForm({ ...form, client_type: e.target.value })} fullWidth>
            <MenuItem value="CONTADO">Contado</MenuItem>
            <MenuItem value="CREDITO">Crédito</MenuItem>
          </TextField>
          <TextField label="Clasificación" select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} fullWidth>
            <MenuItem value="MAYORISTA">Mayorista</MenuItem>
            <MenuItem value="MINORISTA">Minorista</MenuItem>
            <MenuItem value="ESPECIAL">Especial</MenuItem>
          </TextField>
        </Box>
      </FormModal>
      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={async () => { await handleDelete(confirmDelete.id); setConfirmDelete(null); }}
        title="Eliminar Cliente" message={`¿Eliminar "${confirmDelete?.name}"?`} />
    </>
  );
}
