import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, IconButton, Tooltip, Box, Typography,
  CircularProgress, Button,
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';

/**
 * Reusable data table component.
 *
 * Props:
 *   columns: [{ field, headerName, width?, render? }]
 *   rows: array of objects
 *   loading: boolean
 *   onEdit?: (row) => void
 *   onDelete?: (row) => void
 *   onView?: (row) => void
 *   actions?: (row) => ReactNode | [{ label, onClick, color?, show? }]
 *   emptyMessage?: string
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  actions,
  emptyMessage = 'No hay datos.',
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const showActions = onEdit || onDelete || onView || actions;
  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const renderActions = (row) => {
    if (Array.isArray(actions)) {
      const visible = actions.filter((a) => !a.show || a.show(row));
      return (
        <>
          {onView && (
            <Tooltip title="Ver">
              <IconButton size="small" onClick={() => onView(row)}><Visibility fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(row)}><Edit fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Eliminar">
              <IconButton size="small" color="error" onClick={() => onDelete(row)}><Delete fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {visible.map((a, i) => (
            <Button key={i} size="small" variant="outlined" color={a.color || 'primary'}
              onClick={() => a.onClick(row)} sx={{ ml: 0.5, textTransform: 'none', fontSize: '0.75rem' }}>
              {a.label}
            </Button>
          ))}
        </>
      );
    }
    if (typeof actions === 'function') return actions(row);
    return (
      <>
        {onView && (
          <Tooltip title="Ver">
            <IconButton size="small" onClick={() => onView(row)}><Visibility fontSize="small" /></IconButton>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => onEdit(row)}><Edit fontSize="small" /></IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => onDelete(row)}><Delete fontSize="small" /></IconButton>
          </Tooltip>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.field} sx={{ width: col.width }}>
                  {col.headerName}
                </TableCell>
              ))}
              {showActions && <TableCell align="right">Acciones</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, idx) => (
                <TableRow key={row.id || idx} hover>
                  {columns.map((col) => (
                    <TableCell key={col.field}>
                      {col.render ? col.render(row) : row[col.field]}
                    </TableCell>
                  ))}
                  {showActions && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {renderActions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.length > 10 && (
        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Filas por página"
        />
      )}
    </Paper>
  );
}
