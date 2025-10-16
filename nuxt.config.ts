import { provider } from 'std-env'
import { currentLocales } from './i18n/i18n'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Target recent Cloudflare/Nitro behavior to avoid extra compatibility transforms
  compatibilityDate: '2024-10-01',
  modules: [
    '@nuxthub/core',
    'shadcn-nuxt',
    '@vueuse/motion/nuxt',
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
  ],

  devtools: { enabled: true },

  colorMode: {
    classSuffix: '',
  },

  runtimeConfig: {
    // Google OAuth
    googleClientId: process.env.NUXT_GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET || '',
    // Session signing secret (set in env in production)
    authSecret: process.env.NUXT_AUTH_SECRET || crypto.randomUUID(),
    siteToken: crypto.randomUUID(),
    redirectStatusCode: '301',
    linkCacheTtl: 60,
    redirectWithQuery: false,
    homeURL: '',
    cfAccountId: process.env.NUXT_CF_ACCOUNT_ID || '',
    cfApiToken: process.env.NUXT_CF_API_TOKEN || '',
    dataset: process.env.NUXT_DATASET || 'urls_anallytics',
    aiModel: '@cf/meta/llama-3.1-8b-instruct',
    aiPrompt: `You are a URL shortening assistant, please shorten the URL provided by the user into a SLUG. The SLUG information must come from the URL itself, do not make any assumptions. A SLUG is human-readable and should not exceed three words and can be validated using regular expressions {slugRegex} . Only the best one is returned, the format must be JSON reference {"slug": "example-slug"}`,
    caseSensitive: false,
    listQueryLimit: 500,
    disableBotAccessLog: false,
    public: {
      previewMode: '',
      slugDefaultLength: '6',
    },
  },

  routeRules: {
    '/': {
      prerender: true,
    },
    '/dashboard/**': {
      prerender: true,
      ssr: false,
    },
    '/dashboard': {
      redirect: '/dashboard/links',
    },
    '/api/**': {
      cors: process.env.NUXT_API_CORS === 'true',
    },
  },

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    enforceModuleCompatibility: true,
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
    timing: true,
    openAPI: {
      production: 'runtime',
      meta: {
        title: 'Sink API',
        description: 'A Simple / Speedy / Secure Link Shortener with Analytics, 100% run on Cloudflare.',
      },
      route: '/_docs/openapi.json',
      ui: {
        scalar: {
          route: '/_docs/scalar',
        },
        swagger: {
          route: '/_docs/swagger',
        },
      },
    },
  },

  // Vite build tuning to reduce single large bundle sizes
  vite: {
    build: {
      // allow larger chunks warning threshold, but better to split large libs
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            globe: ['globe.gl'],
            charts: ['@unovis/vue', '@unovis/ts'],
            d3: ['d3-scale', 'd3-scale-chromatic'],
          },
        },
      },
    },
  },

  hub: {
    ai: true,
    analytics: true,
    blob: false,
    cache: false,
    database: false,
    kv: true,
    workers: true,
  },

  eslint: {
    config: {
      stylistic: true,
      standalone: false,
    },
  },

  i18n: {
    locales: currentLocales,
    compilation: {
      strictMessage: false,
      escapeHtml: true,
    },
    lazy: true,
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'sink_i18n_redirected',
      redirectOn: 'root',
    },
    baseUrl: '/',
    defaultLocale: 'en-US',
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './app/components/ui',
  },
<<<<<<< HEAD
})
=======
})
```

**Changes:**
- ✅ Changed `workers: provider !== 'cloudflare_pages'` → `workers: true`
- ✅ Changed `compatibilityDate: '2025-10-14'` → `compatibilityDate: '2024-10-01'`
- ✅ Added `process.env.NUXT_DATASET` fallback with your dataset name
- ✅ Added environment variable fallbacks for `cfAccountId` and `cfApiToken`

---

### 3. **Update Cloudflare Pages Bindings** (CRITICAL)

You need to make sure your **Cloudflare Pages bindings match the KV namespace ID**:

**Current Settings (WRONG):**
```
KV namespace: KV → shorturl
```

**Should Be:**
```
KV namespace: KV → 771d749f8c9a4ec18dbf44a5a760a195
>>>>>>> df5316dc7a664d4f3361820074f703863fb8318d
