import { useState } from 'react';
import { Button, Tooltip } from '@mui/material';
import { VerifiedUser, Cancel } from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import useCrud from '../../hooks/useCrud';
import { invoicesAPI } from '../../api/endpoints';

const COLUMNS = [
  { field: 'invoice_number', headerName: 'No. Factura' },
  { field: 'client_name', headerName: 'Cliente', render: (r) => r.client_name || '—' },
  { field: 'order_number', headerName: 'Pedido' },
  { field: 'status', headerName: 'Estado', render: (r) => <StatusBadge status={r.status} label={r.status_display} /> },
  { field: 'total', headerName: 'Total', render: (r) => `Q${r.total}` },
  { field: 'fel_uuid', headerName: 'FEL UUID', render: (r) => r.fel_uuid ? r.fel_uuid.substring(0, 12) + '...' : '—' },
  { field: 'invoice_date', headerName: 'Fecha' },
];

export default function BillingPage() {
  const { rows, loading, refresh } = useCrud(invoicesAPI);
  const [search, setSearch] = useState('');

  const filtered = rows.filter((r) =>
    r.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.client_name?.toLowerCase().includes(search.toLowerCase())
  );

  const certify = async (id) => {
    try { await invoicesAPI.certify(id); refresh(); } catch {}
  };

  const cancel = async (id) => {
    const reason = prompt('Motivo de anulación (mínimo 10 caracteres):');
    if (!reason || reason.length < 10) return;
    try { await invoicesAPI.cancel(id, { reason }); refresh(); } catch {}
  };

  const renderActions = (row) => (
    <>
      {row.status === 'DRAFT' && (
        <Tooltip title="Certificar FEL">
          <Button size="small" color="success" onClick={() => certify(row.id)}><VerifiedUser fontSize="small" /></Button>
        </Tooltip>
      )}
      {row.status === 'CERTIFIED' && (
        <Tooltip title="Anular">
          <Button size="small" color="error" onClick={() => cancel(row.id)}><Cancel fontSize="small" /></Button>
        </Tooltip>
      )}
    </>
  );

  return (
    <>
      <PageHeader title="Facturación">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar factura..." />
      </PageHeader>
      <DataTable columns={COLUMNS} rows={filtered} loading={loading} actions={renderActions} />
    </>
  );
}
