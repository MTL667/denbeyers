import type { Role } from '@prisma/client'

interface AuthUser {
  id: string
  name: string | null
  email: string | null
  role: Role
}

interface AuthSession {
  authenticated: boolean
  user: AuthUser | null
}

export const useAuth = () => {
  const session = useState<AuthSession | null>('auth-session', () => null)
  const loading = useState('auth-loading', () => true)

  const fetchSession = async () => {
    try {
      loading.value = true
      const data = await $fetch<AuthSession>('/api/auth/session')
      session.value = data
    } catch (error) {
      console.error('Failed to fetch session:', error)
      session.value = { authenticated: false, user: null }
    } finally {
      loading.value = false
    }
  }

  const login = () => {
    navigateTo('/api/auth/login', { external: true })
  }

  const logout = async () => {
    try {
      const result = await $fetch<{ success: boolean; logoutUrl: string }>('/api/auth/logout', {
        method: 'POST',
      })
      session.value = { authenticated: false, user: null }
      if (result.logoutUrl) {
        navigateTo(result.logoutUrl, { external: true })
      } else {
        navigateTo('/')
      }
    } catch (error) {
      console.error('Logout failed:', error)
      navigateTo('/')
    }
  }

  const isAuthenticated = computed(() => session.value?.authenticated ?? false)
  const user = computed(() => session.value?.user ?? null)
  const isOwner = computed(() => user.value?.role === 'OWNER')
  const isAdmin = computed(() => user.value?.role === 'ADMIN' || user.value?.role === 'OWNER')
  const isUser = computed(() => !!user.value)

  return {
    session,
    loading,
    fetchSession,
    login,
    logout,
    isAuthenticated,
    user,
    isOwner,
    isAdmin,
    isUser,
  }
}

