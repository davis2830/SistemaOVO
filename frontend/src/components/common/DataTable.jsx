import { useState } from 'react';

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
  const perPage = 10;
  const showActions = onEdit || onDelete || onView || actions;
  const totalPages = Math.ceil(rows.length / perPage);
  const paginatedRows = rows.slice(page * perPage, (page + 1) * perPage);

  const renderActions = (row) => {
    const btns = [];
    if (onView) {
      btns.push(
        <button key="view" onClick={() => onView(row)} className="text-gray-500 hover:text-charcoal p-1" title="Ver">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
      );
    }
    if (onEdit) {
      btns.push(
        <button key="edit" onClick={() => onEdit(row)} className="text-blue-500 hover:text-blue-700 p-1" title="Editar">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
      );
    }
    if (onDelete) {
      btns.push(
        <button key="delete" onClick={() => onDelete(row)} className="text-red-400 hover:text-red-600 p-1" title="Eliminar">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      );
    }
    if (Array.isArray(actions)) {
      const visible = actions.filter((a) => !a.show || a.show(row));
      visible.forEach((a, i) => {
        const colorClass = a.color === 'error' || a.color === 'red'
          ? 'border-red-300 text-red-600 hover:bg-red-50'
          : a.color === 'success' || a.color === 'green'
          ? 'border-green-300 text-green-600 hover:bg-green-50'
          : a.color === 'info'
          ? 'border-sky-300 text-sky-600 hover:bg-sky-50'
          : 'border-yolk text-charcoal hover:bg-yolk/10';
        btns.push(
          <button key={`act-${i}`} onClick={() => a.onClick(row)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${colorClass} transition-colors`}>
            {a.label}
          </button>
        );
      });
    } else if (typeof actions === 'function') {
      btns.push(<span key="custom">{actions(row)}</span>);
    }
    return btns;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-yolk border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-premium border border-gray-50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-eggshell border-b border-gray-100">
              {columns.map((col) => (
                <th key={col.field} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider" style={col.width ? { width: col.width } : undefined}>
                  {col.headerName}
                </th>
              ))}
              {showActions && <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showActions ? 1 : 0)} className="text-center py-8 text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-eggshell/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.field} className="px-4 py-3 text-charcoal">
                      {col.render ? col.render(row) : row[col.field]}
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {renderActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{rows.length} registros</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
              Anterior
            </button>
            <span className="px-3 py-1 text-xs font-semibold">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
