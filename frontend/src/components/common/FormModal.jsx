import { useEffect, useRef } from 'react';

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
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widthClass = maxWidth === 'lg' ? 'max-w-3xl' : maxWidth === 'md' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${widthClass} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-display font-bold text-charcoal">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-charcoal transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-charcoal transition-colors rounded-xl hover:bg-gray-50">
            {submitLabel === '' ? 'Cerrar' : 'Cancelar'}
          </button>
          {submitLabel !== '' && (
            <button onClick={onSubmit} disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-yolk text-charcoal font-semibold text-sm rounded-xl hover:bg-amber-400 transition-colors shadow-sm disabled:opacity-50">
              {loading && <div className="w-4 h-4 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />}
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
