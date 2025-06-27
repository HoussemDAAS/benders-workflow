const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('🔧 API_BASE_URL:', API_BASE_URL);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('🌐 Making API request:', { 
    endpoint, 
    API_BASE_URL, 
    fullUrl: url,
    method: options.method || 'GET'
  });
  
  // Get auth token and workspace ID from localStorage
  const token = localStorage.getItem('auth-token');
  const workspaceId = localStorage.getItem('current-workspace-id');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(workspaceId && { 'X-Workspace-Id': workspaceId }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      throw new ApiError(response.status, errorText || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`💥 API Request failed for ${url}:`, error);
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) => apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: <T>(endpoint: string, data: unknown) => apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: <T>(endpoint: string, data: unknown) => apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (endpoint: string) => apiRequest(endpoint, {
    method: 'DELETE',
  }),
};

export const apiService = {
  get: <T>(endpoint: string): Promise<T> => api.get<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown): Promise<T> => api.post<T>(endpoint, data),
  put: <T>(endpoint: string, data?: unknown): Promise<T> => api.put<T>(endpoint, data),
  patch: <T>(endpoint: string, data?: unknown): Promise<T> => api.patch<T>(endpoint, data),
  delete: (endpoint: string): Promise<unknown> => api.delete(endpoint),
};