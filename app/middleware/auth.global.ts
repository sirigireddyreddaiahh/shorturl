// app/middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client-side
  if (import.meta.server) return

  // Don't check auth for home page and auth routes
  if (to.path === '/' || to.path.startsWith('/api/')) {
    return
  }

  // Check if accessing protected dashboard routes (except login)
  if (to.path.startsWith('/dashboard') && to.path !== '/dashboard/login') {
    try {
      // Verify session with server (checks SESSION cookie)
      await $fetch('/api/verify', { 
        credentials: 'include',
        // Add retry with exponential backoff for initial load
        retry: 2,
        retryDelay: 100,
      })
      // Session is valid, allow access
      return
    }
    catch (error: any) {
      // Session invalid or expired, redirect to login
      console.warn('Session verification failed:', error?.statusCode, error?.statusMessage)
      return navigateTo('/dashboard/login')
    }
  }

  // If already on login page and has valid session, redirect to dashboard
  if (to.path === '/dashboard/login') {
    try {
      await $fetch('/api/verify', { 
        credentials: 'include',
        retry: 1,
      })
      // User is already logged in, redirect to links
      return navigateTo('/dashboard/links')
    }
    catch (error) {
      // Not logged in, stay on login page
      return
    }
  }
})