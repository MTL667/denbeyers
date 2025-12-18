export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, isAdmin, loading, fetchSession } = useAuth()

  // Wait for session to load if still loading
  if (loading.value) {
    await fetchSession()
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/api/auth/login', { external: true })
  }

  // Redirect to home if not admin or owner
  if (!isAdmin.value) {
    return navigateTo('/')
  }
})

