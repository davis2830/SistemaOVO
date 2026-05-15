import { useState } from 'react';
import { Button, Tooltip } from '@mui/material';
import { CheckCircle, LocalShipping, Inventory, Cancel } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import useCrud from '../../hooks/useCrud';
import { salesOrdersAPI } from '../../api/endpoints';

const COLUMNS = [
  { field: 'order_number', headerName: 'Pedido' },
  { field: 'client_name', headerName: 'Cliente', render: (r) => r.client_name || '—' },
  { field: 'status', headerName: 'Estado', render: (r) => <StatusBadge status={r.status} label={r.status_display} /> },
  { field: 'payment_type', headerName: 'Pago' },
  { field: 'total', headerName: 'Total', render: (r) => `Q${r.total}` },
  { field: 'order_date', headerName: 'Fecha' },
];

export default function SalesPage() {
  const { rows, loading, refresh } = useCrud(salesOrdersAPI);
  const [search, setSearch] = useState('');

  const filtered = rows.filter((r) =>
    r.order_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const transition = async (id, action) => {
    try {
      await salesOrdersAPI.transition(id, { action });
      refresh();
    } catch {}
  };

  const renderActions = (row) => {
    const btns = [];
    if (row.status === 'DRAFT') btns.push(
      <Tooltip key="confirm" title="Confirmar"><Button size="small" color="primary" onClick={() => transition(row.id, 'confirm')}><CheckCircle fontSize="small" /></Button></Tooltip>
    );
    if (row.status === 'CONFIRMED') btns.push(
      <Tooltip key="dispatch" title="Despachar"><Button size="small" color="info" onClick={() => transition(row.id, 'dispatch')}><LocalShipping fontSize="small" /></Button></Tooltip>
    );
    if (row.status === 'DISPATCHED') btns.push(
      <Tooltip key="deliver" title="Entregar"><Button size="small" color="success" onClick={() => transition(row.id, 'deliver')}><Inventory fontSize="small" /></Button></Tooltip>
    );
    if (!['INVOICED', 'CANCELLED'].includes(row.status)) btns.push(
      <Tooltip key="cancel" title="Anular"><Button size="small" color="error" onClick={() => transition(row.id, 'cancel')}><Cancel fontSize="small" /></Button></Tooltip>
    );
    return <>{btns}</>;
  };

  return (
    <>
      <PageHeader title="Ventas (Pedidos)">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar pedido..." />
      </PageHeader>
      <DataTable columns={COLUMNS} rows={filtered} loading={loading} actions={renderActions} />
    </>
  );
}
