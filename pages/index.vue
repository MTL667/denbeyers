<script setup lang="ts">
const { isAuthenticated, login } = useAuth()
const { items, loading, fetchMedia } = useMedia()

onMounted(() => {
  fetchMedia(true)
})

// Get first 6 items for preview
const previewItems = computed(() => items.value.slice(0, 6))
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-warmth-gradient opacity-90"></div>
      
      <!-- Floating Hearts -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          v-for="i in 12" 
          :key="i"
          class="absolute text-4xl opacity-20 animate-float"
          :style="{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`
          }"
        >
          💛
        </div>
      </div>

      <!-- Content -->
      <div class="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 class="font-display text-6xl md:text-8xl text-white mb-6 animate-fade-in-up">
          Voor Nick
        </h1>
        
        <p class="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto animate-fade-in-up" style="animation-delay: 0.1s">
          Laat een foto, filmpje of opkikker achter voor Nick in het ziekenhuis. 
          Samen maken we zijn dagen een beetje warmer! 💛
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style="animation-delay: 0.2s">
          <button
            v-if="!isAuthenticated"
            @click="login"
            class="px-8 py-4 rounded-xl text-lg font-bold bg-white text-warmth-600 shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1 hover:scale-105"
          >
            Aanmelden & Delen
          </button>

          <NuxtLink
            v-else
            to="/upload"
            class="px-8 py-4 rounded-xl text-lg font-bold bg-white text-warmth-600 shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1 hover:scale-105"
          >
            Deel een boodschap
          </NuxtLink>

          <NuxtLink
            to="/gallery"
            class="px-8 py-4 rounded-xl text-lg font-medium bg-white/20 text-white border-2 border-white/50 hover:bg-white/30 transition-all"
          >
            Bekijk de galerij
          </NuxtLink>
        </div>
      </div>

      <!-- Wave Bottom -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#FEF3C7"/>
        </svg>
      </div>
    </section>

    <!-- Preview Gallery -->
    <section class="py-16 px-4 bg-warmth-100">
      <div class="max-w-7xl mx-auto">
        <h2 class="font-display text-4xl md:text-5xl text-warmth-700 text-center mb-12">
          Recente Berichten
        </h2>

        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-warmth-300 border-t-warmth-600"></div>
        </div>

        <div 
          v-else-if="previewItems.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <MediaCard
            v-for="(item, index) in previewItems"
            :key="item.id"
            :item="item"
            class="animate-fade-in-up"
            :style="{ animationDelay: `${index * 0.1}s` }"
          />
        </div>

        <p 
          v-else
          class="text-center text-warmth-600 py-12"
        >
          Nog geen berichten. Wees de eerste die een boodschap achterlaat! 💛
        </p>

        <div class="text-center mt-12">
          <NuxtLink
            to="/gallery"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-warmth-500 text-white font-medium hover:bg-warmth-600 transition-colors"
          >
            Bekijk alle berichten
            <span>→</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-16 px-4 bg-white">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="font-display text-4xl md:text-5xl text-warmth-700 mb-12">
          Hoe werkt het?
        </h2>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="p-6">
            <div class="w-16 h-16 rounded-full bg-warmth-100 flex items-center justify-center text-3xl mx-auto mb-4">
              1️⃣
            </div>
            <h3 class="font-bold text-lg text-warmth-700 mb-2">Meld je aan</h3>
            <p class="text-gray-600">Log in met je account om een bericht te kunnen delen.</p>
          </div>

          <div class="p-6">
            <div class="w-16 h-16 rounded-full bg-warmth-100 flex items-center justify-center text-3xl mx-auto mb-4">
              📸
            </div>
            <h3 class="font-bold text-lg text-warmth-700 mb-2">Upload je bericht</h3>
            <p class="text-gray-600">Deel een foto, video of lieve boodschap voor Nick.</p>
          </div>

          <div class="p-6">
            <div class="w-16 h-16 rounded-full bg-warmth-100 flex items-center justify-center text-3xl mx-auto mb-4">
              💛
            </div>
            <h3 class="font-bold text-lg text-warmth-700 mb-2">Verspreid warmte</h3>
            <p class="text-gray-600">Na goedkeuring verschijnt je bericht in de galerij!</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

