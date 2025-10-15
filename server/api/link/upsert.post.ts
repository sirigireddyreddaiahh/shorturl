import { LinkSchema } from '@@/schemas/link'

export default eventHandler(async (event) => {
  const link = await readValidatedBody(event, LinkSchema.parse)
  const { caseSensitive } = useRuntimeConfig(event)

  if (!caseSensitive) {
    link.slug = link.slug.toLowerCase()
  }

  // Get the authenticated user
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User must be authenticated to upsert links'
    })
  }

  const { cloudflare } = event.context
  const { KV } = cloudflare.env

  // Check if link exists
  const existingLink = await KV.get(`link:${link.slug}`, { type: 'json' })

  if (existingLink) {
    // Check ownership
    if (existingLink.owner && existingLink.owner.sub !== user.sub) {
      throw createError({
        status: 403,
        statusText: 'You do not have permission to modify this link',
      })
    }

    // If link exists and user owns it, return it
    const shortLink = `${getRequestProtocol(event)}://${getRequestHost(event)}/${link.slug}`
    return { link: existingLink, shortLink, status: 'existing' }
  }

  // If link doesn't exist, create it with owner
  const linkWithOwner = {
    ...link,
    owner: {
      sub: user.sub,
      email: user.email,
      name: user.name
    }
  }

  const expiration = getExpiration(event, link.expiration)

  await KV.put(`link:${link.slug}`, JSON.stringify(linkWithOwner), {
    expiration,
    metadata: {
      expiration,
      url: link.url,
      comment: link.comment,
      owner: {
        sub: user.sub,
        email: user.email,
      }
    },
  })

  setResponseStatus(event, 201)
  const shortLink = `${getRequestProtocol(event)}://${getRequestHost(event)}/${link.slug}`
  
  console.log(`✅ Link upserted by ${user.email}: ${link.slug}`)
  
  return { link: linkWithOwner, shortLink, status: 'created' }
})