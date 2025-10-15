// server/api/link/list.get.ts
import { z } from 'zod'

export default eventHandler(async (event) => {
  const { cloudflare } = event.context
  
  if (!cloudflare?.env?.KV) {
    throw createError({
      statusCode: 500,
      statusMessage: 'KV store not available'
    })
  }

  const { KV } = cloudflare.env

  const { limit, cursor } = await getValidatedQuery(
    event,
    z.object({
      limit: z.coerce.number().max(1024).default(20),
      cursor: z.string().trim().max(1024).optional(),
    }).parse
  )

  try {
    const list = await KV.list({
      prefix: 'link:',
      limit,
      cursor: cursor || undefined,
    })

    if (Array.isArray(list.keys)) {
      list.links = await Promise.all(
        list.keys.map(async (key: { name: string }) => {
          const { metadata, value: link } = await KV.getWithMetadata(key.name, { type: 'json' })
          if (link) {
            return { ...metadata, ...link }
          }
          return null
        })
      )
      
      // Filter out null values
      list.links = list.links.filter(Boolean)
    }
    else {
      list.links = []
    }

    // Filter by owner for multi-user setup
    if (event.context?.user && Array.isArray(list.links)) {
      const userSub = event.context.user.sub
      list.links = list.links.filter((l: any) => {
        // If link has no owner, it's accessible to all (backward compatibility)
        if (!l.owner) return true
        // Otherwise, check if owner matches current user
        return l.owner.sub === userSub
      })
    }

    delete list.keys
    
    return {
      links: list.links || [],
      cursor: list.cursor || '',
      list_complete: list.list_complete || false
    }
  }
  catch (error) {
    console.error('Error fetching links:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch links'
    })
  }
})