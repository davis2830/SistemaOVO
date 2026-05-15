import { TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';

/**
 * Reusable search input.
 * Props: value, onChange, placeholder?
 */
export default function SearchBar({ value, onChange, placeholder = 'Buscar...' }) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
        ),
      }}
      sx={{ minWidth: 250 }}
    />
  );
}
