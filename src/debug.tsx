import { useState, useEffect } from 'react';

export function Debug() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API connection...');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        console.log('API URL:', apiUrl);
        
        const response = await fetch(`${apiUrl}/dashboard/stats`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API Response:', result);
        setData(result);
      } catch (err) {
        console.error('API Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div>
      <h1>API Debug</h1>
      <h2>Dashboard Stats:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
} 