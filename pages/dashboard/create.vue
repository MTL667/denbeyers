<script setup lang="ts">
definePageMeta({
  middleware: ['admin'],
})

const { user, isOwner } = useAuth()
const { uploading, progress, error, uploadMedia, reset } = useUpload()
const router = useRouter()

// Only owner can create posts
if (!isOwner.value) {
  navigateTo('/dashboard')
}

const file = ref<File | null>(null)
const message = ref('')
const displayName = ref('Nick')
const isSticky = ref(false)
const dragActive = ref(false)
const previewUrl = ref<string | null>(null)

const acceptedTypes = 'image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime'

const handleDrop = (e: DragEvent) => {
  dragActive.value = false
  const droppedFile = e.dataTransfer?.files[0]
  if (droppedFile) {
    handleFile(droppedFile)
  }
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const selectedFile = target.files?.[0]
  if (selectedFile) {
    handleFile(selectedFile)
  }
}

const handleFile = (selectedFile: File) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
  if (!validTypes.includes(selectedFile.type)) {
    error.value = 'Ongeldig bestandstype.'
    return
  }

  if (selectedFile.size > 200 * 1024 * 1024) {
    error.value = 'Bestand is te groot. Maximum is 200MB.'
    return
  }

  file.value = selectedFile
  error.value = null

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(selectedFile)
}

const removeFile = () => {
  file.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

const isVideo = computed(() => file.value?.type.startsWith('video/'))

const handleSubmit = async () => {
  if (!file.value) return

  const result = await uploadMedia(file.value, {
    message: message.value || undefined,
    displayName: displayName.value || 'Nick',
    consent: true,
    isOwnerPost: true,
    isSticky: isSticky.value,
  })

  if (result.success) {
    router.push('/dashboard')
  }
}

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="min-h-screen py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink 
          to="/dashboard" 
          class="text-warmth-600 hover:text-warmth-700 mb-4 inline-flex items-center gap-2"
        >
          ← Terug naar dashboard
        </NuxtLink>
        <h1 class="font-display text-4xl md:text-5xl text-warmth-700 mb-2">
          Nieuwe Post
        </h1>
        <p class="text-warmth-600">
          Maak een nieuwe post als owner
        </p>
      </div>

      <!-- Form -->
      <form 
        @submit.prevent="handleSubmit"
        class="bg-white rounded-2xl shadow-xl p-8 space-y-6"
      >
        <!-- Error Display -->
        <div 
          v-if="error"
          class="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200"
        >
          {{ error }}
        </div>

        <!-- File Upload -->
        <div>
          <label class="block text-sm font-medium text-warmth-700 mb-2">
            Foto of Video *
          </label>
          
          <div 
            v-if="!file"
            class="dropzone border-warmth-300 hover:border-warmth-500 cursor-pointer transition-colors"
            :class="{ 'active': dragActive }"
            @dragover.prevent="dragActive = true"
            @dragleave="dragActive = false"
            @drop.prevent="handleDrop"
            @click="($refs.fileInput as HTMLInputElement).click()"
          >
            <input
              ref="fileInput"
              type="file"
              :accept="acceptedTypes"
              class="hidden"
              @change="handleFileSelect"
            />
            <div class="text-center">
              <div class="text-5xl mb-4">📸</div>
              <p class="text-warmth-600 font-medium mb-2">
                Sleep je bestand hier of klik om te uploaden
              </p>
            </div>
          </div>

          <div 
            v-else
            class="relative rounded-xl overflow-hidden bg-warmth-50"
          >
            <img 
              v-if="!isVideo && previewUrl"
              :src="previewUrl"
              class="w-full h-64 object-contain"
            />
            <video 
              v-else-if="previewUrl"
              :src="previewUrl"
              class="w-full h-64 object-contain"
              controls
            />
            <button
              type="button"
              @click="removeFile"
              class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Message -->
        <div>
          <label class="block text-sm font-medium text-warmth-700 mb-2">
            Boodschap (optioneel)
          </label>
          <textarea
            v-model="message"
            rows="4"
            maxlength="500"
            class="w-full px-4 py-3 rounded-xl border border-warmth-200 focus:border-warmth-500 focus:ring-2 focus:ring-warmth-200 outline-none transition-all resize-none"
            placeholder="Schrijf een boodschap..."
          />
        </div>

        <!-- Display Name -->
        <div>
          <label class="block text-sm font-medium text-warmth-700 mb-2">
            Naam
          </label>
          <input
            v-model="displayName"
            type="text"
            maxlength="100"
            class="w-full px-4 py-3 rounded-xl border border-warmth-200 focus:border-warmth-500 focus:ring-2 focus:ring-warmth-200 outline-none transition-all"
          />
        </div>

        <!-- Sticky Toggle -->
        <div>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="isSticky"
              type="checkbox"
              class="w-5 h-5 rounded border-warmth-300 text-warmth-500 focus:ring-warmth-500"
            />
            <span class="text-warmth-700">
              📌 Direct uitlichten (sticky)
            </span>
          </label>
        </div>

        <!-- Progress Bar -->
        <div 
          v-if="uploading"
          class="space-y-2"
        >
          <div class="h-3 rounded-full bg-warmth-100 overflow-hidden">
            <div 
              class="h-full bg-warmth-gradient transition-all duration-300"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <p class="text-sm text-warmth-600 text-center">
            Uploaden... {{ progress }}%
          </p>
        </div>

        <!-- Submit -->
        <div class="flex gap-4">
          <button
            type="submit"
            :disabled="!file || uploading"
            class="flex-1 py-4 rounded-xl text-lg font-bold bg-warmth-gradient text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="uploading">Bezig met uploaden...</span>
            <span v-else>Post aanmaken 💛</span>
          </button>
          <NuxtLink
            to="/dashboard"
            class="px-6 py-4 rounded-xl text-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Annuleren
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

