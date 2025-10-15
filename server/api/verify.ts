// server/api/verify.ts
import { verifySession } from '../utils/auth'

defineRouteMeta({
  openAPI: {
    description: 'Verify the user session',
    responses: {
      200: {
        description: 'Session is valid',
      },
      401: {
        description: 'Session is invalid or expired',
      },
    },
  },
})

export default eventHandler((event) => {
  // Get cookie from request
  const cookieHeader = event.node?.req?.headers?.cookie || ''
  
  if (!cookieHeader) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'No session cookie found' 
    })
  }

  // Parse cookies
  const cookies = parseCookies(cookieHeader)
  const token = cookies?.SESSION

  if (!token) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'No session token found' 
    })
  }

  // Get auth secret
  const secret = useRuntimeConfig(event).authSecret

  if (!secret) {
    console.error('❌ Missing authSecret')
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Server configuration error' 
    })
  }

  // Verify the session token
  const user = verifySession(token, secret)

  if (!user) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Invalid or expired session' 
    })
  }

  // Return user info if session is valid
  return {
    authenticated: true,
    user: {
      name: user.name,
      email: user.email,
    },
  }
})

function parseCookies(cookieHeader: string): Record<string, string> {
  if (!cookieHeader) return {}

  return Object.fromEntries(
    cookieHeader.split(';').map((s: string) => {
      const [k, v] = s.split('=').map((p: string) => p?.trim())
      return [k, v ? decodeURIComponent(v) : '']
    })
  )
}