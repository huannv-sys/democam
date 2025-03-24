import { QueryClient } from '@tanstack/react-query';

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const baseUrl = '';  // Uses the proxy configured in vite.config.js
    
    // Ensure URL starts with /api/ when hitting our backend
    const apiUrl = url.startsWith('/api/') ? url : url.startsWith('/') ? `/api${url}` : `/api/${url}`;
    
    const response = await fetch(`${baseUrl}${apiUrl}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || 
        errorData.message ||
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    // Some endpoints may return no content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    }
  },
});