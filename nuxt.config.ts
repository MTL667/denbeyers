// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  ssr: true,

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  runtimeConfig: {
    // Server-only config
    keycloakIssuer: process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/denbeyers',
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || 'denbeyers-app',
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    keycloakRedirectUrl: process.env.KEYCLOAK_REDIRECT_URL || 'http://localhost:3000/auth/callback',

    s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET || 'denbeyers',
    s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',

    databaseUrl: process.env.DATABASE_URL || 'postgresql://denbeyers:denbeyers@localhost:5432/denbeyers',

    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '200'),
    maxStickyItems: parseInt(process.env.MAX_STICKY_ITEMS || '10'),

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

