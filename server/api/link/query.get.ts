export default eventHandler(async (event) => {
  const slug = getQuery(event).slug
  
  if (!slug) {
    throw createError({
      status: 400,
      statusText: 'Slug is required',
    })
  }

  // Get the authenticated user
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User must be authenticated to query links'
    })
  }

  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const { metadata, value: link } = await KV.getWithMetadata(`link:${slug}`, { type: 'json' })
  
  if (!link) {
    throw createError({
      status: 404,
      statusText: 'Link not found',
    })
  }

  // Check if the user owns this link
  if (link.owner && link.owner.sub !== user.sub) {
    throw createError({
      status: 403,
      statusText: 'You do not have permission to view this link',
    })
  }

  return {
    ...metadata,
    ...link,
  }
})