export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Clear auth cookies
  deleteCookie(event, 'auth_token', { path: '/' })
  deleteCookie(event, 'refresh_token', { path: '/' })
  
  // Build Keycloak logout URL
  const logoutUrl = new URL(`${config.keycloakIssuer}/protocol/openid-connect/logout`)
  logoutUrl.searchParams.set('client_id', config.keycloakClientId)
  logoutUrl.searchParams.set('post_logout_redirect_uri', config.keycloakRedirectUrl.replace('/auth/callback', '/'))
  
  return {
    success: true,
    logoutUrl: logoutUrl.toString(),
  }
})

