// server/middleware/2.auth.ts
import { verifySession } from '../utils/auth'

export default eventHandler((event) => {
  const url = event.node?.req?.url || event.path || ''

  // Allow unauthenticated access to these routes
  if (
    url.startsWith('/api/auth')
    || url.startsWith('/api/_')
    || url.startsWith('/_nuxt')
    || url.startsWith('/.well-known')
    || url.startsWith('/callback')
    || url === '/'
    || url === '/api/verify' // Allow verify endpoint
  ) {
    return
  }

  // Only protect /api/* endpoints (excluding auth routes)
  if (event.path && event.path.startsWith('/api/')) {
    const cookieHeader = event.node?.req?.headers?.cookie || ''

    if (!cookieHeader) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'No authentication cookie found' 
      })
    }

  const cookies = parseCookies(cookieHeader)
  const token = cookies?.SESSION

    if (!token) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'No session token found' 
      })
    }

    const secret = useRuntimeConfig(event).authSecret

    if (!secret) {
      console.error('❌ Missing authSecret in runtime config')
      throw createError({ 
        statusCode: 500, 
        statusMessage: 'Server configuration error' 
      })
    }

    const user = verifySession(token, secret)

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Invalid or expired session' 
      })
    }

    // Attach user to event context
    event.context.user = user
  }
})

function parseCookies(cookieHeader: string): Record<string, string> {
  try {
    if (!cookieHeader) return {}

    return Object.fromEntries(
      cookieHeader.split(';').map((cookie: string) => {
        const [rawKey, ...rest] = cookie.split('=')
        const key = (rawKey ?? '').trim()
        return [key, decodeURIComponent(rest.join('=').trim())]
      })
    )
  }
  catch (e) {
    console.error('❌ Error parsing cookies:', e)
    return {}
  }
}