export default eventHandler((event) => {
  const cfg = useRuntimeConfig(event)
  const clientId = (cfg.googleClientId || cfg.public?.googleClientId) as string | undefined

  if (!clientId) {
    console.error('❌ googleClientId not configured')
    throw createError({ statusCode: 500, statusMessage: 'Google OAuth not configured' })
  }

  const redirectUri = `${getRequestProtocol(event)}://${getRequestHost(event)}/api/auth/callback`
  const state = crypto.randomUUID()

  // Set OAuth state cookie for CSRF protection
  setCookie(event, 'oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15 // 15 minutes
  })

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account'
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  console.log('🔐 Redirecting to Google OAuth', { redirectUri })

  return sendRedirect(event, authUrl)
})