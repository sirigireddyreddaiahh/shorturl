import { LinkSchema } from '@@/schemas/link'

defineRouteMeta({
  openAPI: {
    description: 'Create a new short link',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['url'],
            properties: {
              url: {
                type: 'string',
                description: 'The URL to shorten',
              },
            },
          },
        },
      },
    },
  },
})

export default eventHandler(async (event) => {
  const link = await readValidatedBody(event, LinkSchema.parse)

  const { caseSensitive } = useRuntimeConfig(event)

  if (!caseSensitive) {
    link.slug = link.slug.toLowerCase()
  }

  // Get the authenticated user from context
  const user = event.context.user
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'User must be authenticated to create links'
    })
  }

  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  
  const existingLink = await KV.get(`link:${link.slug}`)
  if (existingLink) {
    throw createError({
      status: 409,
      statusText: 'Link already exists',
    })
  }

  // Attach owner information to the link
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
  
  console.log(`✅ Link created by ${user.email}: ${link.slug}`)
  
  return { link: linkWithOwner, shortLink }
})