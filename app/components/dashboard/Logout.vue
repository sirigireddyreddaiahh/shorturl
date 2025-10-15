<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

async function logOut() {
  try {
    // Call server logout endpoint to clear session cookie
    await $fetch('/api/auth/logout', { 
      credentials: 'include',
      // Don't follow redirects automatically
      redirect: 'manual',
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always redirect to login page after logout attempt
    // This ensures the user is logged out even if the request fails
    await navigateTo('/dashboard/login', { 
      replace: true,
      external: false,
    })
  }
}
</script>

<template>
  <AlertDialog>
    <AlertDialogTrigger as-child>
      <LogOut class="w-4 h-4 cursor-pointer" />
    </AlertDialogTrigger>
    <AlertDialogContent class="max-w-[95svw] max-h-[95svh] md:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto]">
      <AlertDialogHeader>
        <AlertDialogTitle>{{ $t('logout.title') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ $t('logout.confirm') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction @click="logOut">
          {{ $t('logout.action') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>