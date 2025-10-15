
<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(async () => {
  try {
    await $fetch('/api/verify', { credentials: 'include' })
  } catch (error: any) {
    if (error && (error.statusCode === 401 || error.response?.status === 401)) {
      await navigateTo('/dashboard/login')
    }
  }
})
</script>

<template>
  <main class="space-y-6">
    <DashboardBreadcrumb title="Links" />
    <DashboardLinks />
  </main>
</template>
