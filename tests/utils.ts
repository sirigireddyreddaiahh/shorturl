// `cloudflare:test` types are only available in worker test environments; use
// a runtime-safe fallback to allow local type-checking.
const SELF = (globalThis as any).SELF ?? (globalThis as any)

export async function fetchWithAuth(path: string, options?: RequestInit) {
  return SELF.fetch(`http://localhost${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${'' /* replaced: use authenticated session in tests */}`,
    },
  })
}

export async function fetch(path: string, options?: RequestInit) {
  return SELF.fetch(`http://localhost${path}`, options)
}
