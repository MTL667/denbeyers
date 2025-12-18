export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  // Clear auth cookies
  deleteCookie(event, 'auth_token', { path: '/' })
  deleteCookie(event, 'refresh_token', { path: '/' })
  
  // Build Keycloak logout URL
  // Extract base URL from redirect URL
  const baseUrl = config.keycloakRedirectUrl.replace(/\/api\/auth\/callback$/, '').replace(/\/auth\/callback$/, '')
  
  const logoutUrl = new URL(`${config.keycloakIssuer}/protocol/openid-connect/logout`)
  logoutUrl.searchParams.set('client_id', config.keycloakClientId)
  logoutUrl.searchParams.set('post_logout_redirect_uri', baseUrl || 'https://denbeyers.be')
  
  return {
    success: true,
    logoutUrl: logoutUrl.toString(),
  }
})
