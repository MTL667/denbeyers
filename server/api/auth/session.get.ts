import { optionalAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await optionalAuth(event)
  
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

