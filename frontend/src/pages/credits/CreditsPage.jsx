import { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import useCrud from '../../hooks/useCrud';
import { creditAccountsAPI, creditTransactionsAPI } from '../../api/endpoints';

const ACCOUNT_COLUMNS = [
  { field: 'client_name', headerName: 'Cliente', render: (r) => r.client_name || '—' },
  { field: 'credit_limit', headerName: 'Límite', render: (r) => `Q${r.credit_limit}` },
  { field: 'current_balance', headerName: 'Saldo', render: (r) => `Q${r.current_balance}` },
  { field: 'available_credit', headerName: 'Disponible', render: (r) => `Q${r.available_credit}` },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

const TX_COLUMNS = [
  { field: 'transaction_type', headerName: 'Tipo', render: (r) => <StatusBadge status={r.transaction_type} /> },
  { field: 'amount', headerName: 'Monto', render: (r) => `Q${r.amount}` },
  { field: 'balance_after', headerName: 'Saldo Después', render: (r) => `Q${r.balance_after}` },
  { field: 'reference_number', headerName: 'Referencia' },
  { field: 'notes', headerName: 'Notas' },
  { field: 'created_at', headerName: 'Fecha', render: (r) => new Date(r.created_at).toLocaleString() },
];

export default function CreditsPage() {
  const [tab, setTab] = useState(0);
  const accounts = useCrud(creditAccountsAPI);
  const transactions = useCrud(creditTransactionsAPI, { autoLoad: false });

  return (
    <>
      <PageHeader title="Créditos" />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); if (v === 1) transactions.refresh(); }}>
          <Tab label="Cuentas" />
          <Tab label="Transacciones" />
        </Tabs>
      </Box>
      {tab === 0 && <DataTable columns={ACCOUNT_COLUMNS} rows={accounts.rows} loading={accounts.loading} />}
      {tab === 1 && <DataTable columns={TX_COLUMNS} rows={transactions.rows} loading={transactions.loading} />}
    </>
  );
}
