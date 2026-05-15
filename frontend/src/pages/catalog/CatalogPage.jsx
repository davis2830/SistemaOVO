import { useState, useEffect } from 'react';
import { TextField, Box, Tabs, Tab, MenuItem } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import useCrud from '../../hooks/useCrud';
import { productsAPI, categoriesAPI } from '../../api/endpoints';

// ── Categories tab ──
const CAT_COLUMNS = [
  { field: 'name', headerName: 'Nombre' },
  { field: 'description', headerName: 'Descripción' },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

// ── Products tab ──
const PROD_COLUMNS = [
  { field: 'code', headerName: 'Código', width: 120 },
  { field: 'name', headerName: 'Nombre' },
  { field: 'category_name', headerName: 'Categoría', render: (r) => r.category_name || '—' },
  { field: 'units_per_carton', headerName: 'Und/Cartón' },
  { field: 'cartons_per_box', headerName: 'Cart/Caja' },
  { field: 'units_per_box', headerName: 'Und/Caja' },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

const EMPTY_CAT = { name: '', description: '' };
const EMPTY_PROD = { code: '', name: '', category: '', units_per_carton: 30, cartons_per_box: 24 };

export default function CatalogPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  // Categories
  const categories = useCrud(categoriesAPI);
  const [catModal, setCatModal] = useState(false);
  const [catEditing, setCatEditing] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [catDelete, setCatDelete] = useState(null);

  // Products
  const products = useCrud(productsAPI);
  const [prodModal, setProdModal] = useState(false);
  const [prodEditing, setProdEditing] = useState(null);
  const [prodForm, setProdForm] = useState(EMPTY_PROD);
  const [prodDelete, setProdDelete] = useState(null);

  const [saving, setSaving] = useState(false);

  // ── Category handlers ──
  const openCatCreate = () => { setCatEditing(null); setCatForm(EMPTY_CAT); setCatModal(true); };
  const openCatEdit = (r) => { setCatEditing(r); setCatForm({ name: r.name, description: r.description || '' }); setCatModal(true); };
  const submitCat = async () => {
    setSaving(true);
    try {
      if (catEditing) await categories.handleUpdate(catEditing.id, catForm);
      else await categories.handleCreate(catForm);
      setCatModal(false);
    } catch {}
    setSaving(false);
  };

  // ── Product handlers ──
  const openProdCreate = () => { setProdEditing(null); setProdForm(EMPTY_PROD); setProdModal(true); };
  const openProdEdit = (r) => {
    setProdEditing(r);
    setProdForm({ code: r.code, name: r.name, category: r.category || '', units_per_carton: r.units_per_carton || 30, cartons_per_box: r.cartons_per_box || 24 });
    setProdModal(true);
  };
  const submitProd = async () => {
    setSaving(true);
    try {
      const payload = { ...prodForm };
      if (!payload.category) delete payload.category;
      if (prodEditing) await products.handleUpdate(prodEditing.id, payload);
      else await products.handleCreate(payload);
      setProdModal(false);
    } catch {}
    setSaving(false);
  };

  const filter = (rows) => rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Catálogo"
        onAdd={tab === 0 ? openCatCreate : openProdCreate}
        addLabel={tab === 0 ? 'Nueva Categoría' : 'Nuevo Producto'}
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Categorías" />
          <Tab label="Productos" />
        </Tabs>
      </Box>

      {/* ── Categories ── */}
      {tab === 0 && (
        <>
          <DataTable columns={CAT_COLUMNS} rows={filter(categories.rows)} loading={categories.loading}
            onEdit={openCatEdit} onDelete={(r) => setCatDelete(r)} />
          <FormModal open={catModal} onClose={() => setCatModal(false)} onSubmit={submitCat}
            title={catEditing ? 'Editar Categoría' : 'Nueva Categoría'} loading={saving}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Nombre" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required fullWidth />
              <TextField label="Descripción" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} fullWidth multiline rows={2} />
            </Box>
          </FormModal>
          <ConfirmDialog open={!!catDelete} onClose={() => setCatDelete(null)}
            onConfirm={async () => { await categories.handleDelete(catDelete.id); setCatDelete(null); }}
            title="Eliminar Categoría" message={`¿Eliminar "${catDelete?.name}"?`} />
        </>
      )}

      {/* ── Products ── */}
      {tab === 1 && (
        <>
          <DataTable columns={PROD_COLUMNS} rows={filter(products.rows)} loading={products.loading}
            onEdit={openProdEdit} onDelete={(r) => setProdDelete(r)} />
          <FormModal open={prodModal} onClose={() => setProdModal(false)} onSubmit={submitProd}
            title={prodEditing ? 'Editar Producto' : 'Nuevo Producto'} loading={saving}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField label="Código" value={prodForm.code} onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })} required fullWidth />
              <TextField label="Nombre" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} required fullWidth />
              <TextField label="Categoría" select value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })} fullWidth>
                <MenuItem value="">Sin categoría</MenuItem>
                {categories.rows.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
              <TextField label="Unidades por Cartón" type="number" value={prodForm.units_per_carton}
                onChange={(e) => setProdForm({ ...prodForm, units_per_carton: parseInt(e.target.value) || 0 })} fullWidth />
              <TextField label="Cartones por Caja" type="number" value={prodForm.cartons_per_box}
                onChange={(e) => setProdForm({ ...prodForm, cartons_per_box: parseInt(e.target.value) || 0 })} fullWidth />
            </Box>
          </FormModal>
          <ConfirmDialog open={!!prodDelete} onClose={() => setProdDelete(null)}
            onConfirm={async () => { await products.handleDelete(prodDelete.id); setProdDelete(null); }}
            title="Eliminar Producto" message={`¿Eliminar "${prodDelete?.name}"?`} />
        </>
      )}
    </>
  );
}
