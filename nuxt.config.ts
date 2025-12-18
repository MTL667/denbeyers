// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  ssr: true,

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  runtimeConfig: {
    // Server-only config - use NUXT_ prefix for env vars at runtime
    // NUXT_KEYCLOAK_ISSUER, NUXT_KEYCLOAK_CLIENT_ID, etc.
    keycloakIssuer: '',
    keycloakClientId: '',
    keycloakClientSecret: '',
    keycloakRedirectUrl: '',

    s3Endpoint: '',
    s3Region: 'us-east-1',
    s3Bucket: '',
    s3AccessKey: '',
    s3SecretKey: '',

    databaseUrl: '',

    maxFileSizeMb: 200,
    maxStickyItems: 10,

    // Public config
    public: {
      appName: 'Den Beyers',
      appDescription: 'Laat een foto, filmpje of opkikker achter voor Nick 💛',
    },
  },

  nitro: {
    preset: 'node-server',
  },

  app: {
    head: {
      title: 'Den Beyers - Voor Nick 💛',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Laat een foto, filmpje of opkikker achter voor Nick' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],
})
