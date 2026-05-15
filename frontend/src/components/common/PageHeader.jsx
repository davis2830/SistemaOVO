import { Box, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

/**
 * Reusable page header with title and optional "add" button.
 *
 * Props:
 *   title: string
 *   onAdd?: () => void
 *   addLabel?: string
 *   children?: extra elements (filters, search, etc.)
 */
export default function PageHeader({ title, onAdd, addLabel = 'Nuevo', children }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5">{title}</Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {children}
        {onAdd && (
          <Button variant="contained" startIcon={<Add />} onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}
