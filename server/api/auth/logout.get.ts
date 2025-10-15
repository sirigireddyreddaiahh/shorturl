export default eventHandler((event) => {
  // Clear the session cookie
  setCookie(event, 'SESSION', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0 // Expire immediately
  })

  console.log('👋 User logged out')

  // Redirect to home or login page
  return sendRedirect(event, '/dashboard/login')
})