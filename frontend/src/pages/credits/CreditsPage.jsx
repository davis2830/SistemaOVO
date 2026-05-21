import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import FormModal from '../../components/common/FormModal';
import StatusBadge from '../../components/common/StatusBadge';
import { Input, Select, Tabs, Alert } from '../../components/common/FormField';
import useCrud from '../../hooks/useCrud';
import { creditAccountsAPI, creditTransactionsAPI, clientsAPI } from '../../api/endpoints';

const ACCOUNT_COLUMNS = [
  { field: 'client_name', headerName: 'Cliente' },
  { field: 'client_nit', headerName: 'NIT' },
  { field: 'credit_limit', headerName: 'Límite', render: (r) => `Q ${Number(r.credit_limit).toFixed(2)}` },
  { field: 'current_balance', headerName: 'Saldo Actual', render: (r) => `Q ${Number(r.current_balance).toFixed(2)}` },
  { field: 'available_credit', headerName: 'Disponible', render: (r) => `Q ${Number(r.available_credit).toFixed(2)}` },
  { field: 'utilization_pct', headerName: 'Uso %', render: (r) => `${Number(r.utilization_pct).toFixed(1)}%` },
  { field: 'is_active', headerName: 'Activo', render: (r) => r.is_active ? 'Sí' : 'No' },
];

const TX_COLUMNS = [
  { field: 'client_name', headerName: 'Cliente' },
  { field: 'transaction_type', headerName: 'Tipo', render: (r) => <StatusBadge status={r.transaction_type} /> },
  { field: 'amount', headerName: 'Monto', render: (r) => `Q ${Number(r.amount).toFixed(2)}` },
  { field: 'balance_after', headerName: 'Saldo Después', render: (r) => `Q ${Number(r.balance_after).toFixed(2)}` },
  { field: 'payment_method', headerName: 'Método Pago', render: (r) => r.payment_method || '—' },
  { field: 'reference_number', headerName: 'Referencia', render: (r) => r.reference_number || '—' },
  { field: 'created_at', headerName: 'Fecha', render: (r) => new Date(r.created_at).toLocaleString() },
];

const EMPTY_ACCOUNT = { client: '', credit_limit: '' };
const EMPTY_PAYMENT = { account: '', amount: '', payment_method: 'EFECTIVO', reference_number: '', notes: '' };
const PAYMENT_METHODS = ['EFECTIVO', 'CHEQUE', 'TRANSFERENCIA', 'TARJETA'];

export default function CreditsPage() {
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const accounts = useCrud(creditAccountsAPI);
  const transactions = useCrud(creditTransactionsAPI, { autoLoad: false });
  const clients = useCrud(clientsAPI);

  const [accModal, setAccModal] = useState(false);
  const [accForm, setAccForm] = useState(EMPTY_ACCOUNT);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState(EMPTY_PAYMENT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreateAccount = () => { setAccForm(EMPTY_ACCOUNT); setError(''); setAccModal(true); };
  const submitAccount = async () => {
    setSaving(true); setError('');
    try {
      await accounts.handleCreate({ client: accForm.client, credit_limit: parseFloat(accForm.credit_limit) });
      setAccModal(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Error al crear cuenta';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    setSaving(false);
  };

  const openPayment = (acc) => {
    setPayForm({ ...EMPTY_PAYMENT, account: acc.id });
    setError('');
    setPayModal(true);
  };
  const submitPayment = async () => {
    setSaving(true); setError('');
    try {
      await creditAccountsAPI.payment({
        account: payForm.account,
        amount: parseFloat(payForm.amount),
        payment_method: payForm.payment_method,
        reference_number: payForm.reference_number,
        notes: payForm.notes,
      });
      accounts.refresh();
      setPayModal(false);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Error al registrar pago';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    setSaving(false);
  };

  const handleTabChange = (i) => {
    setTab(i);
    if (i === 1) transactions.refresh();
  };

  const filter = (rows) => rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Créditos"
        onAdd={tab === 0 ? openCreateAccount : undefined}
        addLabel="Nueva Cuenta"
      >
        <SearchBar value={search} onChange={setSearch} />
      </PageHeader>

      <Tabs tabs={['Cuentas', 'Transacciones']} active={tab} onChange={handleTabChange} />

      {tab === 0 && (
        <>
          <DataTable columns={ACCOUNT_COLUMNS} rows={filter(accounts.rows)} loading={accounts.loading}
            actions={[{ label: 'Registrar Pago', onClick: openPayment, color: 'success' }]} />
          <FormModal open={accModal} onClose={() => setAccModal(false)} onSubmit={submitAccount}
            title="Nueva Cuenta de Crédito" loading={saving}>
            <div className="space-y-4">
              {error && <Alert>{error}</Alert>}
              <Select label="Cliente" required value={accForm.client}
                onChange={(e) => setAccForm({ ...accForm, client: e.target.value })}>
                <option value="">— Seleccionar —</option>
                {clients.rows.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.nit})</option>)}
              </Select>
              <Input label="Límite de Crédito (Q)" required type="number" step="0.01" min="0"
                value={accForm.credit_limit} onChange={(e) => setAccForm({ ...accForm, credit_limit: e.target.value })} />
            </div>
          </FormModal>

          <FormModal open={payModal} onClose={() => setPayModal(false)} onSubmit={submitPayment}
            title="Registrar Pago" loading={saving}>
            <div className="space-y-4">
              {error && <Alert>{error}</Alert>}
              <Input label="Monto (Q)" required type="number" step="0.01" min="0"
                value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
              <Select label="Método de Pago" value={payForm.payment_method}
                onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
              <Input label="Número de Referencia" value={payForm.reference_number}
                onChange={(e) => setPayForm({ ...payForm, reference_number: e.target.value })} />
              <Input label="Notas" value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} />
            </div>
          </FormModal>
        </>
      )}

      {tab === 1 && (
        <DataTable columns={TX_COLUMNS} rows={filter(transactions.rows)} loading={transactions.loading} />
      )}
    </>
  );
}
