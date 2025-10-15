import { signSession } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)

  if (q.error) {
    console.error('❌ Google OAuth error:', q.error)
    throw createError({ statusCode: 400, statusMessage: `Google OAuth error: ${q.error}` })
  }

  const cookieHeader = event.node?.req?.headers?.cookie || ''
  const cookies = parseCookies(cookieHeader)

  if (!cookies || !cookies.oauth_state || cookies.oauth_state !== q.state) {
    console.error('❌ Invalid OAuth state')
    throw createError({ statusCode: 400, statusMessage: 'Invalid state parameter' })
  }

  const code = String(q.code || '')
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing authorization code' })
  }

  const cfg = useRuntimeConfig(event)
  const clientId = (cfg.googleClientId || cfg.public?.googleClientId) as string | undefined
  const clientSecret = cfg.googleClientSecret as string | undefined

  if (!clientId || !clientSecret) {
    console.error('❌ Missing Google OAuth credentials')
    throw createError({ statusCode: 500, statusMessage: 'Server configuration error' })
  }

  const redirectUri = `${getRequestProtocol(event)}://${getRequestHost(event)}/api/auth/callback`

  try {
    // Exchange code for tokens
    const tokenResp = await $fetch<Record<string, any>>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    const id_token = String(tokenResp?.id_token || '')
    if (!id_token) {
      throw new Error('No id_token received from Google')
    }

    // Validate id_token
    const info = await $fetch<Record<string, any>>('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token }
    })

    if (!info || info.aud !== clientId) {
      console.error('❌ Invalid id_token audience')
      throw createError({ statusCode: 400, statusMessage: 'Invalid id_token' })
    }

    // Create user session
    const user = {
      sub: info.sub as string,
      email: info.email as string,
      name: (info.name as string) || (info.email as string)
    }

    const secret = cfg.authSecret
    if (!secret) {
      throw new Error('authSecret not configured')
    }

    const sessionToken = signSession(user, secret)

    // Set session cookie
    setCookie(event, 'SESSION', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: getRequestProtocol(event) === 'https',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Clear OAuth state cookie
    setCookie(event, 'oauth_state', '', { maxAge: 0, path: '/' })

    console.log('✅ User logged in successfully:', user.email)

    return sendRedirect(event, '/dashboard/links')
  }
  catch (error: any) {
    console.error('❌ OAuth callback error:', error.message || error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication failed'
    })
  }
})

function parseCookies(cookieHeader: string): Record<string, string> {
  if (!cookieHeader)
    return {}

  return Object.fromEntries(
    cookieHeader.split(';').map((s: string) => {
      const [k, v] = s.split('=').map((p: string) => p?.trim())
      return [k, v ? decodeURIComponent(v) : '']
    })
  ) as Record<string, string>
}