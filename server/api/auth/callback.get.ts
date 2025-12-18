export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const { code, state, error, error_description } = query
  
  // Handle errors from Keycloak
  if (error) {
    console.error('Keycloak error:', error, error_description)
    return sendRedirect(event, '/?error=auth_failed')
  }
  
  // Verify state
  const storedState = getCookie(event, 'oauth_state')
  if (!storedState || storedState !== state) {
    console.error('State mismatch')
    return sendRedirect(event, '/?error=invalid_state')
  }
  
  // Clear state cookie
  deleteCookie(event, 'oauth_state')
  
  if (!code || typeof code !== 'string') {
    return sendRedirect(event, '/?error=no_code')
  }
  
  try {
    // Exchange code for tokens
    const tokenUrl = `${config.keycloakIssuer}/protocol/openid-connect/token`
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.keycloakClientId,
        client_secret: config.keycloakClientSecret,
        code,
        redirect_uri: config.keycloakRedirectUrl,
      }),
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return sendRedirect(event, '/?error=token_exchange_failed')
    }
    
    const tokens = await tokenResponse.json()
    
    // Set the access token in an HTTP-only cookie
    setCookie(event, 'auth_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/',
    })
    
    // Also set refresh token if available
    if (tokens.refresh_token) {
      setCookie(event, 'refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.refresh_expires_in || 86400,
        path: '/',
      })
    }
    
    return sendRedirect(event, '/gallery')
  } catch (error) {
    console.error('Callback error:', error)
    return sendRedirect(event, '/?error=callback_failed')
  }
})

