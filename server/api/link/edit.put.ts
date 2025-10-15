import type { z } from 'zod'
import { LinkSchema } from '@@/schemas/link'

export default eventHandler(async (event) => {
  const { previewMode } = useRuntimeConfig(event).public
  if (previewMode) {
    throw createError({
      status: 403,
      statusText: 'Preview mode cannot edit links.',
    })
  }

  // Get the authenticated user
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User must be authenticated to edit links'
    })
  }

  const link = await readValidatedBody(event, LinkSchema.parse)
  const { cloudflare } = event.context
  const { KV } = cloudflare.env

  const existingLink: z.infer<typeof LinkSchema> | null = await KV.get(`link:${link.slug}`, { type: 'json' })
  
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
      statusText: 'You do not have permission to edit this link',
    })
  }

  const newLink = {
    ...existingLink,
    ...link,
    id: existingLink.id, // don't update id
    createdAt: existingLink.createdAt, // don't update createdAt
    updatedAt: Math.floor(Date.now() / 1000),
    owner: existingLink.owner || { // preserve owner
      sub: user.sub,
      email: user.email,
      name: user.name
    }
  }
  
  const expiration = getExpiration(event, newLink.expiration)
  
  await KV.put(`link:${newLink.slug}`, JSON.stringify(newLink), {
    expiration,
    metadata: {
      expiration,
      url: newLink.url,
      comment: newLink.comment,
      owner: {
        sub: user.sub,
        email: user.email,
      }
    },
  })
  
  setResponseStatus(event, 201)
  const shortLink = `${getRequestProtocol(event)}://${getRequestHost(event)}/${newLink.slug}`
  
  console.log(`✅ Link updated by ${user.email}: ${newLink.slug}`)
  
  return { link: newLink, shortLink }
})