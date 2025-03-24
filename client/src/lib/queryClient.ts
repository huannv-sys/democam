import { QueryClient } from '@tanstack/react-query';

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const baseUrl = '';  // Uses the proxy configured in vite.config.js
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  // Some endpoints may return no content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});