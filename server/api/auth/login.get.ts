export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
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

