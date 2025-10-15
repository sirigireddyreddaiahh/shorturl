<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'
import { Loader } from 'lucide-vue-next'

interface LinkItem {
  id: string
  slug: string
  createdAt: number
  [key: string]: any
}

const links = ref<LinkItem[]>([])
const limit = 24
let cursor = ''
let listComplete = false
let listError = false

const sortBy = ref('az')

const displayedLinks = computed(() => {
  const sorted = [...links.value]
  switch (sortBy.value) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt)
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt)
    case 'az':
      return sorted.sort((a, b) => a.slug.localeCompare(b.slug))
    case 'za':
      return sorted.sort((a, b) => b.slug.localeCompare(a.slug))
    default:
      return sorted
  }
})

interface LinkListResponse {
  links?: LinkItem[]
  cursor?: string
  list_complete?: boolean
}

async function getLinks() {
  try {
    const data = await $fetch<LinkListResponse>('/api/link/list', {
      query: {
        limit,
        cursor,
      },
      credentials: 'include', // Important: include cookies
    })
    links.value = links.value.concat(data.links || []).filter(Boolean)
    cursor = data.cursor || ''
    listComplete = data.list_complete || false
    listError = false
  }
  catch (error: any) {
    console.error('Error loading links:', error)
    listError = true
    // If unauthorized, redirect to login
    if (error && (error.statusCode === 401 || error.response?.status === 401)) {
      await navigateTo('/dashboard/login')
    }
  }
}

const { isLoading } = useInfiniteScroll(
  document,
  getLinks,
  {
    distance: 150,
    interval: 1000,
    canLoadMore: () => {
      return !listError && !listComplete
    },
  },
)

function updateLinkList(link: LinkItem, type: string) {
  if (type === 'edit') {
    const index = links.value.findIndex(l => l.id === link.id)
    if (index !== -1) {
      links.value[index] = link
    }
  }
  else if (type === 'delete') {
    const index = links.value.findIndex(l => l.id === link.id)
    if (index !== -1) {
      links.value.splice(index, 1)
    }
  }
  else {
    links.value.unshift(link)
    sortBy.value = 'newest'
  }
}
</script>

<template>
  <main class="space-y-6">
    <div class="flex flex-col gap-6 sm:gap-2 sm:flex-row sm:justify-between">
      <DashboardNav class="flex-1">
        <div class="flex items-center gap-2">
          <DashboardLinksEditor @update:link="updateLinkList" />
          <DashboardLinksSort v-model:sort-by="sortBy" />
        </div>
      </DashboardNav>
      <LazyDashboardLinksSearch />
    </div>
    
    <section 
      v-if="displayedLinks.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <DashboardLinksLink
        v-for="link in displayedLinks"
        :key="link.id"
        :link="link"
        @update:link="updateLinkList"
      />
    </section>
    
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-8"
    >
      <Loader class="w-6 h-6 animate-spin" />
    </div>
    
    <div
      v-if="!isLoading && displayedLinks.length === 0 && !listError"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <p class="text-lg font-medium">{{ $t('links.no_links') }}</p>
      <p class="text-sm text-muted-foreground mt-2">{{ $t('links.create_first') }}</p>
    </div>
    
    <div
      v-if="!isLoading && listComplete && displayedLinks.length > 0"
      class="flex items-center justify-center text-sm text-muted-foreground py-4"
    >
      {{ $t('links.no_more') }}
    </div>
    
    <div
      v-if="listError"
      class="flex flex-col items-center justify-center text-sm py-8"
    >
      <p class="text-destructive mb-2">{{ $t('links.load_failed') }}</p>
      <Button variant="outline" @click="getLinks">
        {{ $t('common.try_again') }}
      </Button>
    </div>
  </main>
</template>