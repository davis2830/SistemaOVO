import { Chip } from '@mui/material';

const STATUS_COLORS = {
  // Sales
  DRAFT: 'default',
  CONFIRMED: 'primary',
  DISPATCHED: 'info',
  DELIVERED: 'success',
  INVOICED: 'secondary',
  CANCELLED: 'error',
  // Inventory
  ACTIVE: 'success',
  DEPLETED: 'warning',
  EXPIRED: 'error',
  // Billing
  CERTIFIED: 'success',
  ERROR: 'error',
  // Purchases
  RECEIVED: 'success',
  PARTIAL: 'warning',
  // Credits
  CHARGE: 'error',
  PAYMENT: 'success',
  ADJUSTMENT: 'info',
  // Generic
  PENDING: 'warning',
  SENT: 'success',
  FAILED: 'error',
  READ: 'default',
  PROCESSING: 'info',
  COMPLETED: 'success',
};

/**
 * Reusable status chip.
 * Props: status (string), label? (override text)
 */
export default function StatusBadge({ status, label }) {
  return (
    <Chip
      label={label || status}
      color={STATUS_COLORS[status] || 'default'}
      size="small"
      variant="outlined"
    />
  );
}
