export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, loading, fetchSession } = useAuth()

  // Wait for session to load if still loading
  if (loading.value) {
    await fetchSession()
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    return navigateTo('/api/auth/login', { external: true })
  }
})

