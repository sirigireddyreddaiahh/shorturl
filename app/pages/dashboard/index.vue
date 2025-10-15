<script setup lang="ts">
// This page handles /dashboard route
// Redirects to /dashboard/links for authenticated users
// Or /dashboard/login for unauthenticated users

const router = useRouter()

async function checkAndRedirect() {
  try {
    // Check if user has valid session
    await $fetch('/api/verify', { 
      credentials: 'include',
      retry: 2,
      retryDelay: 100,
    })
    // User is authenticated, go to links
    await router.replace('/dashboard/links')
  } catch (error: any) {
    console.warn('Not authenticated, redirecting to login:', error?.statusCode)
    // User is not authenticated, go to login
    await router.replace('/dashboard/login')
  }
}

// Run check immediately on mount
onMounted(() => {
  checkAndRedirect()
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading dashboard...</p>
    </div>
  </div>
</template>