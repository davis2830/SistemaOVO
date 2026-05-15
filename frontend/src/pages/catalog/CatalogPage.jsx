import { useState } from 'react';
import { TextField, Box } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import useCrud from '../../hooks/useCrud';
import { productsAPI, categoriesAPI } from '../../api/endpoints';

const COLUMNS = [
  { field: 'code', headerName: 'Código', width: 120 },
  { field: 'name', headerName: 'Nombre' },
  { field: 'category_name', headerName: 'Categoría', render: (r) => r.category_name || '—' },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

export default function CatalogPage() {
  const { rows, loading, handleCreate, handleUpdate, handleDelete, refresh } = useCrud(productsAPI);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', category: '' });
  const [saving, setSaving] = useState(false);

  const filtered = rows.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.code?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ code: '', name: '', category: '' }); setModalOpen(true); };
  const openEdit = (row) => { setEditing(row); setForm({ code: row.code, name: row.name, category: row.category || '' }); setModalOpen(true); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (editing) await handleUpdate(editing.id, form);
      else await handleCreate(form);
      setModalOpen(false);
    } catch { /* handled by interceptor */ }
    setSaving(false);
  };

  const onConfirmDelete = async () => {
    await handleDelete(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <>
      <PageHeader title="Catálogo de Productos" onAdd={openCreate} addLabel="Nuevo Producto">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar producto..." />
      </PageHeader>
      <DataTable
        columns={COLUMNS} rows={filtered} loading={loading}
        onEdit={openEdit} onDelete={(r) => setConfirmDelete(r)}
      />
      <FormModal
        open={modalOpen} onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit} title={editing ? 'Editar Producto' : 'Nuevo Producto'}
        loading={saving}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required fullWidth />
          <TextField label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
        </Box>
      </FormModal>
      <ConfirmDialog
        open={!!confirmDelete} onClose={() => setConfirmDelete(null)}
        onConfirm={onConfirmDelete}
        title="Eliminar Producto"
        message={`¿Eliminar "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </>
  );
}
