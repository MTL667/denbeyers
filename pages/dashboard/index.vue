<script setup lang="ts">
definePageMeta({
  middleware: ['admin'],
})

const { isOwner } = useAuth()

interface AdminMediaItem {
  id: string
  type: 'IMAGE' | 'VIDEO'
  mimeType: string
  sizeBytes: number
  message: string | null
  displayName: string | null
  consent: boolean
  approved: boolean
  visible: boolean
  isOwnerPost: boolean
  isSticky: boolean
  stickyOrder: number | null
  createdAt: string
  updatedAt: string
  uploader: {
    id: string
    name: string | null
    email: string | null
  }
  mediaUrl: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  hidden: number
  sticky: number
}

const items = ref<AdminMediaItem[]>([])
const stats = ref<Stats>({ total: 0, pending: 0, approved: 0, hidden: 0, sticky: 0 })
const loading = ref(true)
const statusFilter = ref<string>('pending')
const selectedItem = ref<AdminMediaItem | null>(null)

const fetchAdminMedia = async () => {
  try {
    loading.value = true
    const params = new URLSearchParams()
    if (statusFilter.value) {
      params.set('status', statusFilter.value)
    }
    
    const data = await $fetch<{ items: AdminMediaItem[]; stats: Stats }>(`/api/admin/media?${params.toString()}`)
    items.value = data.items
    stats.value = data.stats
  } catch (error) {
    console.error('Failed to fetch admin media:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAdminMedia)

watch(statusFilter, () => fetchAdminMedia())

const updateItem = async (id: string, updates: Record<string, any>) => {
  try {
    await $fetch(`/api/owner/media/${id}`, {
      method: 'PATCH',
      body: updates,
    })
    await fetchAdminMedia()
  } catch (error: any) {
    alert(error.data?.message || 'Update failed')
  }
}

const deleteItem = async (id: string) => {
  if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return
  
  try {
    await $fetch(`/api/owner/media/${id}`, {
      method: 'DELETE',
    })
    await fetchAdminMedia()
    selectedItem.value = null
  } catch (error: any) {
    alert(error.data?.message || 'Delete failed')
  }
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}
</script>

<template>
  <div class="min-h-screen py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="font-display text-4xl md:text-5xl text-warmth-700 mb-2">
          {{ isOwner ? 'Owner Dashboard' : 'Admin Dashboard' }}
        </h1>
        <p class="text-warmth-600">
          Beheer uploads en berichten
        </p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="text-3xl font-bold text-warmth-600">{{ stats.total }}</div>
          <div class="text-sm text-gray-500">Totaal</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="text-3xl font-bold text-amber-500">{{ stats.pending }}</div>
          <div class="text-sm text-gray-500">Wachtend</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="text-3xl font-bold text-green-500">{{ stats.approved }}</div>
          <div class="text-sm text-gray-500">Goedgekeurd</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="text-3xl font-bold text-gray-400">{{ stats.hidden }}</div>
          <div class="text-sm text-gray-500">Verborgen</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <div class="text-3xl font-bold text-warmth-500">{{ stats.sticky }}</div>
          <div class="text-sm text-gray-500">Uitgelicht</div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-4 mb-8">
        <NuxtLink
          v-if="isOwner"
          to="/dashboard/create"
          class="px-4 py-2 rounded-lg bg-warmth-500 text-white font-medium hover:bg-warmth-600 transition-colors"
        >
          ➕ Nieuwe post maken
        </NuxtLink>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          v-for="filter in [
            { value: 'pending', label: 'Wachtend', count: stats.pending },
            { value: 'approved', label: 'Goedgekeurd', count: stats.approved },
            { value: 'hidden', label: 'Verborgen', count: stats.hidden },
            { value: 'sticky', label: 'Uitgelicht', count: stats.sticky },
            { value: '', label: 'Alles', count: stats.total },
          ]"
          :key="filter.value"
          @click="statusFilter = filter.value"
          class="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
          :class="statusFilter === filter.value 
            ? 'bg-warmth-500 text-white' 
            : 'bg-white text-warmth-600 hover:bg-warmth-100'"
        >
          {{ filter.label }} ({{ filter.count }})
        </button>
      </div>

      <!-- Items Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-warmth-300 border-t-warmth-600 mx-auto"></div>
        </div>

        <div v-else-if="items.length === 0" class="p-8 text-center text-gray-500">
          Geen items gevonden
        </div>

        <table v-else class="w-full">
          <thead class="bg-warmth-50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-medium text-warmth-700">Preview</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-warmth-700">Details</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-warmth-700">Status</th>
              <th class="px-4 py-3 text-left text-sm font-medium text-warmth-700">Acties</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-warmth-100">
            <tr 
              v-for="item in items" 
              :key="item.id"
              class="hover:bg-warmth-50 transition-colors"
            >
              <!-- Preview -->
              <td class="px-4 py-3">
                <div 
                  class="w-16 h-16 rounded-lg overflow-hidden bg-warmth-100 cursor-pointer"
                  @click="selectedItem = item"
                >
                  <img 
                    v-if="item.type === 'IMAGE'"
                    :src="item.mediaUrl"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-2xl">
                    🎬
                  </div>
                </div>
              </td>

              <!-- Details -->
              <td class="px-4 py-3">
                <div class="text-sm">
                  <div class="font-medium text-warmth-700">
                    {{ item.displayName || 'Anoniem' }}
                    <span v-if="item.isOwnerPost" class="ml-1">💛</span>
                  </div>
                  <div class="text-gray-500 text-xs">
                    {{ item.uploader?.name || item.uploader?.email || 'Unknown' }}
                  </div>
                  <div class="text-gray-400 text-xs mt-1">
                    {{ formatDate(item.createdAt) }} · {{ formatBytes(item.sizeBytes) }}
                  </div>
                </div>
              </td>

              <!-- Status -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span 
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="item.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ item.approved ? '✓ Goedgekeurd' : '⏳ Wachtend' }}
                  </span>
                  <span 
                    v-if="!item.visible"
                    class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                  >
                    Verborgen
                  </span>
                  <span 
                    v-if="item.isSticky"
                    class="px-2 py-0.5 rounded text-xs font-medium bg-warmth-100 text-warmth-700"
                  >
                    📌 Uitgelicht
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-if="!item.approved"
                    @click="updateItem(item.id, { approved: true })"
                    class="px-3 py-1 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    @click="updateItem(item.id, { visible: !item.visible })"
                    class="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    {{ item.visible ? 'Hide' : 'Show' }}
                  </button>
                  <button
                    @click="updateItem(item.id, { isSticky: !item.isSticky })"
                    class="px-3 py-1 text-xs rounded-lg bg-warmth-100 text-warmth-700 hover:bg-warmth-200 transition-colors"
                  >
                    {{ item.isSticky ? 'Unstick' : 'Sticky' }}
                  </button>
                  <button
                    @click="deleteItem(item.id)"
                    class="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Preview Modal -->
      <Teleport to="body">
        <div 
          v-if="selectedItem"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          @click="selectedItem = null"
        >
          <div 
            class="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            @click.stop
          >
            <button
              @click="selectedItem = null"
              class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ✕
            </button>

            <div class="bg-black">
              <img 
                v-if="selectedItem.type === 'IMAGE'"
                :src="selectedItem.mediaUrl"
                class="w-full max-h-[60vh] object-contain"
              />
              <video 
                v-else
                :src="selectedItem.mediaUrl"
                class="w-full max-h-[60vh]"
                controls
              />
            </div>

            <div class="p-6">
              <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div class="text-sm text-gray-500">Van</div>
                  <div class="font-medium">{{ selectedItem.displayName || 'Anoniem' }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Uploader</div>
                  <div class="font-medium">{{ selectedItem.uploader?.name || selectedItem.uploader?.email }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Datum</div>
                  <div>{{ formatDate(selectedItem.createdAt) }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Grootte</div>
                  <div>{{ formatBytes(selectedItem.sizeBytes) }}</div>
                </div>
              </div>
              
              <div v-if="selectedItem.message" class="mb-4">
                <div class="text-sm text-gray-500 mb-1">Boodschap</div>
                <p class="text-gray-700 whitespace-pre-wrap">{{ selectedItem.message }}</p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  v-if="!selectedItem.approved"
                  @click="updateItem(selectedItem.id, { approved: true })"
                  class="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                >
                  ✓ Goedkeuren
                </button>
                <button
                  @click="updateItem(selectedItem.id, { visible: !selectedItem.visible })"
                  class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  {{ selectedItem.visible ? 'Verbergen' : 'Tonen' }}
                </button>
                <button
                  @click="updateItem(selectedItem.id, { isSticky: !selectedItem.isSticky })"
                  class="px-4 py-2 rounded-lg bg-warmth-100 text-warmth-700 hover:bg-warmth-200 transition-colors"
                >
                  {{ selectedItem.isSticky ? 'Niet meer uitlichten' : 'Uitlichten' }}
                </button>
                <button
                  @click="deleteItem(selectedItem.id)"
                  class="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

