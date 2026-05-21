const STATUS_STYLES = {
  DRAFT: 'bg-gray-100 text-gray-600',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-sky-100 text-sky-700',
  DELIVERED: 'bg-green-100 text-green-700',
  INVOICED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-green-100 text-green-700',
  DEPLETED: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-red-100 text-red-700',
  CERTIFIED: 'bg-green-100 text-green-700',
  ERROR: 'bg-red-100 text-red-700',
  RECEIVED: 'bg-green-100 text-green-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  CHARGE: 'bg-red-100 text-red-700',
  PAYMENT: 'bg-green-100 text-green-700',
  ADJUSTMENT: 'bg-sky-100 text-sky-700',
  PENDING: 'bg-amber-100 text-amber-700',
  SENT: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  READ: 'bg-gray-100 text-gray-600',
  PROCESSING: 'bg-sky-100 text-sky-700',
  COMPLETED: 'bg-green-100 text-green-700',
  IN: 'bg-green-100 text-green-700',
  OUT: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${style}`}>
      {label || status}
    </span>
  );
}
