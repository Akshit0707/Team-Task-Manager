import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(url, options);
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};