import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress,
} from '@mui/material';

/**
 * Reusable modal for forms.
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSubmit: () => void
 *   title: string
 *   submitLabel?: string
 *   loading?: boolean
 *   maxWidth?: 'xs' | 'sm' | 'md' | 'lg'
 *   children: form fields
 */
export default function FormModal({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel = 'Guardar',
  loading = false,
  maxWidth = 'sm',
  children,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>{submitLabel === '' ? 'Cerrar' : 'Cancelar'}</Button>
        {submitLabel !== '' && (
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            {submitLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
