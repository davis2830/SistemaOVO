export default function SearchBar({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <div className="flex items-center bg-eggshell border border-gray-200 rounded-xl px-4 py-2 w-64 focus-within:border-yolk transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full text-charcoal"
      />
    </div>
  );
}
