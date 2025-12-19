export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const refreshToken = getCookie(event, 'refresh_token')
  
  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      message: 'No refresh token available',
    })
  }
  
  try {
    const tokenUrl = `${config.keycloakIssuer}/protocol/openid-connect/token`
    
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.keycloakClientId,
        client_secret: config.keycloakClientSecret,
        refresh_token: refreshToken,
      }),
    })
    
    if (!tokenResponse.ok) {
      // Refresh token expired - user needs to login again
      deleteCookie(event, 'auth_token')
      deleteCookie(event, 'refresh_token')
      
      throw createError({
        statusCode: 401,
        message: 'Session expired. Please login again.',
      })
    }
    
    const tokens = await tokenResponse.json()
    
    // Set new access token
    setCookie(event, 'auth_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/',
    })
    
    // Set new refresh token if provided
    if (tokens.refresh_token) {
      setCookie(event, 'refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: tokens.refresh_expires_in || 86400,
        path: '/',
      })
    }
    
    return {
      success: true,
      expiresIn: tokens.expires_in,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Token refresh error:', error)
    throw createError({
      statusCode: 500,
      message: 'Token refresh failed',
    })
  }
})

