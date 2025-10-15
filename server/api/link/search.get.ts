interface Link {
  slug: string
  url: string
  comment?: string
  owner?: {
    sub: string
    email: string
    name?: string
  }
}

export default eventHandler(async (event) => {
  // Get the authenticated user
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User must be authenticated to search links'
    })
  }

  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const list: Link[] = []
  let finalCursor: string | undefined

  try {
    while (true) {
      const { keys, list_complete, cursor } = await KV.list({
        prefix: `link:`,
        limit: 1000,
        cursor: finalCursor,
      })

      finalCursor = cursor

      if (Array.isArray(keys)) {
        for (const key of keys) {
          try {
            if (key.metadata?.url) {
              // Check owner from metadata
              if (key.metadata.owner && key.metadata.owner.sub !== user.sub) {
                continue // Skip links not owned by this user
              }

              list.push({
                slug: key.name.replace('link:', ''),
                url: key.metadata.url,
                comment: key.metadata.comment,
                owner: key.metadata.owner,
              })
            }
            else {
              // Forward compatible with links without metadata
              const { metadata, value: link } = await KV.getWithMetadata(key.name, { type: 'json' })
              
              if (link) {
                // Check owner from link data
                if (link.owner && link.owner.sub !== user.sub) {
                  continue // Skip links not owned by this user
                }

                list.push({
                  slug: key.name.replace('link:', ''),
                  url: link.url,
                  comment: link.comment,
                  owner: link.owner,
                })
                
                // Update metadata for future queries
                await KV.put(key.name, JSON.stringify(link), {
                  expiration: metadata?.expiration,
                  metadata: {
                    ...metadata,
                    url: link.url,
                    comment: link.comment,
                    owner: link.owner,
                  },
                })
              }
            }
          }
          catch (err) {
            console.error(`Error processing key ${key.name}:`, err)
            continue
          }
        }
      }

      if (!keys || list_complete) {
        break
      }
    }
    
    console.log(`✅ Search returned ${list.length} links for ${user.email}`)
    return list
  }
  catch (err) {
    console.error('Error fetching link list:', err)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch link list',
    })
  }
})