<script setup lang="ts">
const { isAuthenticated, user, isAdmin, logout, login } = useAuth()
const route = useRoute()

const isHomePage = computed(() => route.path === '/')
</script>

<template>
  <div class="min-h-screen bg-soft-gradient">
    <!-- Navigation -->
    <nav 
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      :class="isHomePage ? 'bg-transparent' : 'bg-white/80 backdrop-blur-md shadow-sm'"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink 
            to="/" 
            class="flex items-center gap-2 group"
          >
            <span class="text-3xl animate-heartbeat">💛</span>
            <span 
              class="font-display text-2xl font-bold"
              :class="isHomePage && !isAuthenticated ? 'text-white' : 'text-warmth-600'"
            >
              Den Beyers
            </span>
          </NuxtLink>

          <!-- Navigation Links -->
          <div class="flex items-center gap-4">
            <template v-if="isAuthenticated">
              <NuxtLink 
                to="/gallery" 
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-warmth-100"
                :class="route.path === '/gallery' ? 'text-warmth-600 bg-warmth-100' : 'text-gray-700'"
              >
                Galerij
              </NuxtLink>
              
              <NuxtLink 
                to="/upload" 
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-warmth-100"
                :class="route.path === '/upload' ? 'text-warmth-600 bg-warmth-100' : 'text-gray-700'"
              >
                Uploaden
              </NuxtLink>
              
              <NuxtLink 
                v-if="isAdmin"
                to="/dashboard" 
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-warmth-100"
                :class="route.path.startsWith('/dashboard') ? 'text-warmth-600 bg-warmth-100' : 'text-gray-700'"
              >
                Dashboard
              </NuxtLink>

              <div class="flex items-center gap-3 ml-4 pl-4 border-l border-warmth-200">
                <span class="text-sm text-gray-600">
                  {{ user?.name || 'Gebruiker' }}
                </span>
                <button 
                  @click="logout"
                  class="px-3 py-1.5 text-sm rounded-lg bg-warmth-100 text-warmth-700 hover:bg-warmth-200 transition-colors"
                >
                  Uitloggen
                </button>
              </div>
            </template>

            <template v-else>
              <button 
                @click="login"
                class="px-4 py-2 rounded-lg text-sm font-medium bg-warmth-gradient text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Aanmelden
              </button>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="pt-16">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="py-8 text-center text-warmth-600/60 text-sm">
      <p>Gemaakt met 💛 voor Nick</p>
    </footer>
  </div>
</template>

