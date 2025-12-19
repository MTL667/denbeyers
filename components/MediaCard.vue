<script setup lang="ts">
interface MediaItem {
  id: string
  type: 'IMAGE' | 'VIDEO' | 'TEXT'
  mimeType: string | null
  message: string | null
  displayName: string | null
  isOwnerPost: boolean
  isSticky: boolean
  createdAt: string
  mediaUrl: string | null
}

const props = defineProps<{
  item: MediaItem
}>()

const isExpanded = ref(false)
const imageError = ref(false)

const formattedDate = computed(() => {
  const date = new Date(props.item.createdAt)
  return new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
})

const isVideo = computed(() => props.item.type === 'VIDEO')
const isImage = computed(() => props.item.type === 'IMAGE')
const isTextOnly = computed(() => props.item.type === 'TEXT' || !props.item.mediaUrl)
const hasMedia = computed(() => !isTextOnly.value && props.item.mediaUrl && !imageError.value)

const handleImageError = () => {
  console.error('Image failed to load:', props.item.mediaUrl)
  imageError.value = true
}
</script>

<template>
  <div 
    class="media-card bg-white rounded-2xl shadow-lg overflow-hidden relative"
    :class="{ 'ring-2 ring-warmth-400': item.isSticky }"
  >
    <!-- Sticky Badge -->
    <div 
      v-if="item.isSticky"
      class="absolute top-3 left-3 z-10 sticky-badge"
    >
      📌 Uitgelicht
    </div>

    <!-- Owner Badge -->
    <div 
      v-if="item.isOwnerPost"
      class="absolute top-3 z-10"
      :class="item.isSticky ? 'right-3' : 'left-3'"
    >
      <span class="bg-warmth-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
        💛 Nick
      </span>
    </div>

    <!-- Media (only show if has media) -->
    <div 
      v-if="hasMedia"
      class="relative aspect-square bg-warmth-50 cursor-pointer"
      @click="isExpanded = true"
    >
      <img 
        v-if="isImage"
        :src="item.mediaUrl!"
        :alt="item.displayName || 'Bericht'"
        class="w-full h-full object-cover"
        loading="lazy"
        crossorigin="anonymous"
        @error="handleImageError"
      />
      <div 
        v-else-if="isVideo"
        class="w-full h-full flex items-center justify-center relative"
      >
        <video 
          :src="item.mediaUrl!"
          class="w-full h-full object-cover"
          preload="metadata"
          crossorigin="anonymous"
        />
        <div class="absolute inset-0 flex items-center justify-center bg-black/20">
          <div class="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <span class="text-3xl ml-1">▶️</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Text-only placeholder -->
    <div 
      v-else
      class="relative aspect-video bg-gradient-to-br from-warmth-100 to-warmth-200 cursor-pointer flex items-center justify-center"
      @click="isExpanded = true"
    >
      <span class="text-6xl">💬</span>
    </div>

    <!-- Content -->
    <div class="p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="font-medium text-warmth-700">
          {{ item.displayName || 'Anoniem' }}
        </span>
        <span class="text-sm text-warmth-500">
          {{ formattedDate }}
        </span>
      </div>
      <p 
        v-if="item.message"
        class="text-gray-600 text-sm line-clamp-3"
      >
        {{ item.message }}
      </p>
    </div>

    <!-- Expanded Modal -->
    <Teleport to="body">
      <div 
        v-if="isExpanded"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        @click="isExpanded = false"
      >
        <div 
          class="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
          @click.stop
        >
          <!-- Close Button -->
          <button
            @click="isExpanded = false"
            class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            ✕
          </button>

          <!-- Media -->
          <div v-if="hasMedia" class="bg-black">
            <img 
              v-if="isImage"
              :src="item.mediaUrl!"
              :alt="item.displayName || 'Bericht'"
              class="w-full max-h-[70vh] object-contain"
              crossorigin="anonymous"
            />
            <video 
              v-else-if="isVideo"
              :src="item.mediaUrl!"
              class="w-full max-h-[70vh]"
              controls
              autoplay
              crossorigin="anonymous"
            />
          </div>

          <!-- Content -->
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <span 
                  v-if="item.isOwnerPost"
                  class="bg-warmth-500 text-white px-3 py-1 rounded-full text-sm font-bold"
                >
                  💛 Nick
                </span>
                <span class="font-medium text-warmth-700 text-lg">
                  {{ item.displayName || 'Anoniem' }}
                </span>
              </div>
              <span class="text-warmth-500">
                {{ formattedDate }}
              </span>
            </div>
            <p 
              v-if="item.message"
              class="text-gray-700 text-lg whitespace-pre-wrap"
            >
              {{ item.message }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

