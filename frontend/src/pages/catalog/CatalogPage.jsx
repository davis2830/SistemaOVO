import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Input, Select, Textarea, Tabs } from '../../components/common/FormField';
import useCrud from '../../hooks/useCrud';
import { productsAPI, categoriesAPI } from '../../api/endpoints';

const CAT_COLUMNS = [
  { field: 'name', headerName: 'Nombre' },
  { field: 'description', headerName: 'Descripción' },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

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
  const categories = useCrud(categoriesAPI);
  const products = useCrud(productsAPI);
  const [catModal, setCatModal] = useState(false);
  const [catEditing, setCatEditing] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [catDelete, setCatDelete] = useState(null);
  const [prodModal, setProdModal] = useState(false);
  const [prodEditing, setProdEditing] = useState(null);
  const [prodForm, setProdForm] = useState(EMPTY_PROD);
  const [prodDelete, setProdDelete] = useState(null);
  const [saving, setSaving] = useState(false);

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

      <Tabs tabs={['Categorías', 'Productos']} active={tab} onChange={setTab} />

      {tab === 0 && (
        <>
          <DataTable columns={CAT_COLUMNS} rows={filter(categories.rows)} loading={categories.loading}
            onEdit={openCatEdit} onDelete={(r) => setCatDelete(r)} />
          <FormModal open={catModal} onClose={() => setCatModal(false)} onSubmit={submitCat}
            title={catEditing ? 'Editar Categoría' : 'Nueva Categoría'} loading={saving}>
            <div className="space-y-4">
              <Input label="Nombre" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
              <Textarea label="Descripción" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
            </div>
          </FormModal>
          <ConfirmDialog open={!!catDelete} onClose={() => setCatDelete(null)}
            onConfirm={async () => { await categories.handleDelete(catDelete.id); setCatDelete(null); }}
            title="Eliminar Categoría" message={`¿Eliminar "${catDelete?.name}"?`} />
        </>
      )}

      {tab === 1 && (
        <>
          <DataTable columns={PROD_COLUMNS} rows={filter(products.rows)} loading={products.loading}
            onEdit={openProdEdit} onDelete={(r) => setProdDelete(r)} />
          <FormModal open={prodModal} onClose={() => setProdModal(false)} onSubmit={submitProd}
            title={prodEditing ? 'Editar Producto' : 'Nuevo Producto'} loading={saving}>
            <div className="space-y-4">
              <Input label="Código" required value={prodForm.code} onChange={(e) => setProdForm({ ...prodForm, code: e.target.value })} />
              <Input label="Nombre" required value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
              <Select label="Categoría" value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}>
                <option value="">— Sin categoría —</option>
                {categories.rows.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Und/Cartón" type="number" value={prodForm.units_per_carton}
                  onChange={(e) => setProdForm({ ...prodForm, units_per_carton: parseInt(e.target.value) || 0 })} />
                <Input label="Cart/Caja" type="number" value={prodForm.cartons_per_box}
                  onChange={(e) => setProdForm({ ...prodForm, cartons_per_box: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </FormModal>
          <ConfirmDialog open={!!prodDelete} onClose={() => setProdDelete(null)}
            onConfirm={async () => { await products.handleDelete(prodDelete.id); setProdDelete(null); }}
            title="Eliminar Producto" message={`¿Eliminar "${prodDelete?.name}"?`} />
        </>
      )}
    </>
  );
}
