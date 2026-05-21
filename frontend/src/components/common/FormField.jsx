export function Input({ label, required, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>}
      <input
        {...props}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-charcoal bg-white focus:outline-none focus:border-yolk focus:ring-1 focus:ring-yolk/30 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}

export function Select({ label, required, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>}
      <select
        {...props}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-charcoal bg-white focus:outline-none focus:border-yolk focus:ring-1 focus:ring-yolk/30 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
      >
        {children}
      </select>
    </div>
  );
}

export function Textarea({ label, required, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-600 mb-1">{label}{required && ' *'}</label>}
      <textarea
        {...props}
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-charcoal bg-white focus:outline-none focus:border-yolk focus:ring-1 focus:ring-yolk/30 transition-colors resize-none"
        rows={props.rows || 2}
      />
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <div className={`px-4 py-3 rounded-xl border text-sm ${styles[type] || styles.error}`}>
      {children}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-6">
      {tabs.map((tab, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === i
              ? 'border-yolk text-charcoal font-semibold'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
