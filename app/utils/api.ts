// app/utils/api.ts
export function useAPI(url: string, options: any = {}) {
  return $fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies for authentication
    headers: {
      ...options.headers,
    },
  })
}