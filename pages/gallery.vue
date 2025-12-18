<script setup lang="ts">
definePageMeta({
  middleware: [],
})

const { items, loading, hasMore, filter, fetchMedia, setFilter } = useMedia()

onMounted(() => {
  fetchMedia(true)
})

const loadMore = () => {
  if (!loading.value && hasMore.value) {
    fetchMedia()
  }
}

const filterOptions = [
  { value: 'all', label: 'Alles', icon: '🎨' },
  { value: 'image', label: "Foto's", icon: '📸' },
  { value: 'video', label: "Video's", icon: '🎬' },
] as const
</script>

<template>
  <div class="min-h-screen py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="font-display text-5xl md:text-6xl text-warmth-700 mb-4">
          Galerij
        </h1>
        <p class="text-xl text-warmth-600">
          Alle warme berichten voor Nick 💛
        </p>
      </div>

      <!-- Filters -->
      <div class="flex justify-center gap-2 mb-8">
        <button
          v-for="option in filterOptions"
          :key="option.value"
          @click="setFilter(option.value)"
          class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
          :class="filter === option.value 
            ? 'bg-warmth-500 text-white shadow-lg' 
            : 'bg-white text-warmth-600 hover:bg-warmth-100'"
        >
          <span>{{ option.icon }}</span>
          <span>{{ option.label }}</span>
        </button>
      </div>

      <!-- Gallery Grid -->
      <div v-if="items.length > 0" class="space-y-8">
        <!-- Sticky Items Section -->
        <div v-if="items.some(item => item.isSticky)" class="mb-8">
          <h2 class="font-display text-2xl text-warmth-600 mb-4 flex items-center gap-2">
            <span>📌</span>
            <span>Uitgelicht</span>
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <MediaCard
              v-for="(item, index) in items.filter(i => i.isSticky)"
              :key="item.id"
              :item="item"
              class="animate-fade-in-up ring-2 ring-warmth-400"
              :style="{ animationDelay: `${index * 0.1}s` }"
            />
          </div>
        </div>

        <!-- Regular Items -->
        <div>
          <h2 
            v-if="items.some(item => item.isSticky)"
            class="font-display text-2xl text-warmth-600 mb-4"
          >
            Alle berichten
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <MediaCard
              v-for="(item, index) in items.filter(i => !i.isSticky)"
              :key="item.id"
              :item="item"
              class="animate-fade-in-up"
              :style="{ animationDelay: `${index * 0.05}s` }"
            />
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="text-center pt-8">
          <button
            @click="loadMore"
            :disabled="loading"
            class="px-6 py-3 rounded-xl bg-warmth-500 text-white font-medium hover:bg-warmth-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">Laden...</span>
            <span v-else>Meer laden</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="flex justify-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-warmth-300 border-t-warmth-600"></div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">💛</div>
        <h2 class="text-2xl font-bold text-warmth-700 mb-2">Nog geen berichten</h2>
        <p class="text-warmth-600 mb-6">Wees de eerste die een boodschap achterlaat!</p>
        <NuxtLink
          to="/upload"
          class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-warmth-500 text-white font-medium hover:bg-warmth-600 transition-colors"
        >
          Upload een bericht
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

