<script setup lang="ts">
// This page handles the redirect from the server API callback
// The actual token exchange happens in /api/auth/callback.get.ts
// This page is just a fallback if JavaScript routing is used

const { fetchSession } = useAuth()

onMounted(async () => {
  await fetchSession()
  navigateTo('/gallery')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-4 border-warmth-300 border-t-warmth-600 mx-auto mb-4"></div>
      <p class="text-warmth-600 text-lg">Even geduld...</p>
    </div>
  </div>
</template>

