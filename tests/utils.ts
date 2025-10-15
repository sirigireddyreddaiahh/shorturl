import { SELF } from 'cloudflare:test'

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
