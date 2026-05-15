import { useState, useEffect, useCallback } from 'react';

/**
 * Reusable hook for CRUD operations.
 * Wraps an API module (with list, create, update, delete).
 *
 * Returns: { rows, loading, error, refresh, handleCreate, handleUpdate, handleDelete }
 */
export default function useCrud(apiModule, { autoLoad = true } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiModule.list(params);
      setRows(data.data?.results || data.results || data.data || data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  }, [apiModule]);

  useEffect(() => {
    if (autoLoad) refresh();
  }, [autoLoad, refresh]);

  const handleCreate = async (payload) => {
    const { data } = await apiModule.create(payload);
    await refresh();
    return data;
  };

  const handleUpdate = async (id, payload) => {
    const { data } = await apiModule.update(id, payload);
    await refresh();
    return data;
  };

  const handleDelete = async (id) => {
    await apiModule.delete(id);
    await refresh();
  };

  return { rows, loading, error, refresh, handleCreate, handleUpdate, handleDelete };
}
