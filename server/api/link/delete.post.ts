export default eventHandler(async (event) => {
  const { previewMode } = useRuntimeConfig(event).public
  if (previewMode) {
    throw createError({
      status: 403,
      statusText: 'Preview mode cannot delete links.',
    })
  }

  // Get the authenticated user
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User must be authenticated to delete links'
    })
  }

  const { slug } = await readBody(event)
  
  if (!slug) {
    throw createError({
      status: 400,
      statusText: 'Slug is required',
    })
  }

  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  
  // Get the existing link to check ownership
  const existingLink = await KV.get(`link:${slug}`, { type: 'json' })
  
  if (!existingLink) {
    throw createError({
      status: 404,
      statusText: 'Link not found',
    })
  }

  // Check if the user owns this link
  if (existingLink.owner && existingLink.owner.sub !== user.sub) {
    throw createError({
      status: 403,
      statusText: 'You do not have permission to delete this link',
    })
  }

  await KV.delete(`link:${slug}`)
  
  console.log(`✅ Link deleted by ${user.email}: ${slug}`)
  
  return { success: true }
})