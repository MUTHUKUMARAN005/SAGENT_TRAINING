import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const useFetch = (apiCall, dependencies = [], options = {}) => {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err) {
      setError(err);
      if (options.showError !== false) {
        toast.error(options.errorMessage || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
};

export default useFetch;