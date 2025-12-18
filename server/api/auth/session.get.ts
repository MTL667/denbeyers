import { optionalAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  // Debug: check if cookie exists
  const authToken = getCookie(event, 'auth_token')
  console.log('Session check - auth_token exists:', !!authToken)
  
  const user = await optionalAuth(event)
  
  console.log('Session check - user:', user ? { id: user.id, name: user.name, role: user.role } : null)
  
  if (!user) {
    return {
      authenticated: false,
      user: null,
    }
  }
  
  return {
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }
})
