export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Debug: log config (remove in production)
  console.log('Keycloak config:', {
    issuer: config.keycloakIssuer,
    clientId: config.keycloakClientId,
    redirectUrl: config.keycloakRedirectUrl,
  })
  
  // Validate config
  if (!config.keycloakIssuer) {
    throw createError({
      statusCode: 500,
      message: 'NUXT_KEYCLOAK_ISSUER environment variable is not set',
    })
  }
  
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID()
  
  // Store state in cookie for verification
  setCookie(event, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  })
  
  // Build Keycloak authorization URL
  const authUrl = new URL(`${config.keycloakIssuer}/protocol/openid-connect/auth`)
  authUrl.searchParams.set('client_id', config.keycloakClientId)
  authUrl.searchParams.set('redirect_uri', config.keycloakRedirectUrl)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid profile email')
  authUrl.searchParams.set('state', state)
  
  return sendRedirect(event, authUrl.toString())
})
