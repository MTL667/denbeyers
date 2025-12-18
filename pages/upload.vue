<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

const { user } = useAuth()
const { uploading, progress, error, uploadMedia, reset } = useUpload()

const file = ref<File | null>(null)
const message = ref('')
const displayName = ref('')
const consent = ref(false)
const dragActive = ref(false)
const previewUrl = ref<string | null>(null)
const success = ref(false)

// Set default display name from user
onMounted(() => {
  if (user.value?.name) {
    displayName.value = user.value.name
  }
})

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
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
  if (!validTypes.includes(selectedFile.type)) {
    error.value = 'Ongeldig bestandstype. Alleen JPG, PNG, WebP, MP4 en MOV zijn toegestaan.'
    return
  }

  // Validate file size (200MB)
  if (selectedFile.size > 200 * 1024 * 1024) {
    error.value = 'Bestand is te groot. Maximum is 200MB.'
    return
  }

  file.value = selectedFile
  error.value = null

  // Create preview
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
  if (!file.value || !consent.value) return

  const result = await uploadMedia(file.value, {
    message: message.value || undefined,
    displayName: displayName.value || undefined,
    consent: consent.value,
  })

  if (result.success) {
    success.value = true
    // Reset form after success
    file.value = null
    message.value = ''
    consent.value = false
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }
}

const startOver = () => {
  success.value = false
  reset()
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
      <div class="text-center mb-12">
        <h1 class="font-display text-5xl md:text-6xl text-warmth-700 mb-4">
          Deel je bericht
        </h1>
        <p class="text-xl text-warmth-600">
          Upload een foto of video met een lieve boodschap voor Nick 💛
        </p>
      </div>

      <!-- Success State -->
      <div 
        v-if="success"
        class="bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div class="text-6xl mb-4 animate-heartbeat">💛</div>
        <h2 class="text-2xl font-bold text-warmth-700 mb-2">Bedankt!</h2>
        <p class="text-warmth-600 mb-6">
          Je bericht is ontvangen en wacht op goedkeuring. 
          We waarderen je warmte enorm!
        </p>
        <div class="flex gap-4 justify-center">
          <button
            @click="startOver"
            class="px-6 py-3 rounded-xl bg-warmth-500 text-white font-medium hover:bg-warmth-600 transition-colors"
          >
            Nog een bericht
          </button>
          <NuxtLink
            to="/gallery"
            class="px-6 py-3 rounded-xl bg-warmth-100 text-warmth-700 font-medium hover:bg-warmth-200 transition-colors"
          >
            Naar galerij
          </NuxtLink>
        </div>
      </div>

      <!-- Upload Form -->
      <form 
        v-else
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
          
          <!-- Dropzone -->
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
              <p class="text-sm text-warmth-500">
                JPG, PNG, WebP, MP4 of MOV (max 200MB)
              </p>
            </div>
          </div>

          <!-- Preview -->
          <div 
            v-else
            class="relative rounded-xl overflow-hidden bg-warmth-50"
          >
            <img 
              v-if="!isVideo && previewUrl"
              :src="previewUrl"
              class="w-full h-64 object-contain"
              alt="Preview"
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
            <div class="p-4 text-sm text-warmth-600">
              {{ file.name }} ({{ Math.round(file.size / 1024 / 1024 * 10) / 10 }} MB)
            </div>
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
            placeholder="Schrijf een lieve boodschap voor Nick..."
          />
          <p class="text-sm text-warmth-500 mt-1 text-right">
            {{ message.length }} / 500
          </p>
        </div>

        <!-- Display Name -->
        <div>
          <label class="block text-sm font-medium text-warmth-700 mb-2">
            Jouw naam
          </label>
          <input
            v-model="displayName"
            type="text"
            maxlength="100"
            class="w-full px-4 py-3 rounded-xl border border-warmth-200 focus:border-warmth-500 focus:ring-2 focus:ring-warmth-200 outline-none transition-all"
            placeholder="Hoe wil je genoemd worden?"
          />
        </div>

        <!-- Consent -->
        <div>
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              v-model="consent"
              type="checkbox"
              class="mt-1 w-5 h-5 rounded border-warmth-300 text-warmth-500 focus:ring-warmth-500"
            />
            <span class="text-sm text-warmth-700">
              Ik geef toestemming om mijn bericht te delen op denbeyers.be. 
              Ik begrijp dat mijn bericht eerst wordt gecontroleerd voordat het zichtbaar wordt. *
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

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="!file || !consent || uploading"
          class="w-full py-4 rounded-xl text-lg font-bold bg-warmth-gradient text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <span v-if="uploading">Bezig met uploaden...</span>
          <span v-else>Verstuur bericht 💛</span>
        </button>
      </form>
    </div>
  </div>
</template>

