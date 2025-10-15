import { createHmac } from 'crypto'

// Session cache to prevent excessive logging
const sessionCache = new Map<string, { user: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function signSession(user: any, secret: string) {
  if (!secret) {
    throw new Error('Secret is required for signing session')
  }
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url')
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export function verifySession(token: string, secret: string) {
  try {
    if (!token || !secret) {
      return null
    }

    // Check cache first to avoid excessive verification
    const cached = sessionCache.get(token)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.user
    }

    const parts = token.split('.')
    if (parts.length !== 2) {
      return null
    }

    const [payload, sig] = parts
    const expected = createHmac('sha256', String(secret)).update(String(payload)).digest('hex')

    if (!timingSafeEqual(String(sig), expected)) {
      console.error('❌ Signature mismatch in session token')
      sessionCache.delete(token) // Remove invalid token from cache
      return null
    }
    const json = Buffer.from(String(payload), 'base64url').toString('utf-8')
    const user = JSON.parse(json)

    // Cache the verified session
    sessionCache.set(token, { user, timestamp: Date.now() })

    // Only log once when session is first verified (not cached)
    if (!cached) {
      console.log('✅ Session verified for user:', user.email || user.name || 'unknown')
    }

    return user
  }
  catch (e) {
    console.error('❌ verifySession error:', e)
    return null
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length)
    return false
  let res = 0
  for (let i = 0; i < a.length; i++)
    res |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return res === 0
}

// Clear expired sessions periodically
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of sessionCache.entries()) {
    if (now - data.timestamp > CACHE_TTL) {
      sessionCache.delete(token)
    }
  }
}, CACHE_TTL)