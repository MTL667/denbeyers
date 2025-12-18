interface MediaItem {
  id: string
  type: 'IMAGE' | 'VIDEO'
  mimeType: string
  message: string | null
  displayName: string | null
  isOwnerPost: boolean
  isSticky: boolean
  createdAt: string
  mediaUrl: string
}

interface MediaResponse {
  items: MediaItem[]
  nextCursor: string | null
  hasMore: boolean
}

export const useMedia = () => {
  const items = useState<MediaItem[]>('media-items', () => [])
  const loading = useState('media-loading', () => false)
  const hasMore = useState('media-has-more', () => true)
  const nextCursor = useState<string | null>('media-cursor', () => null)
  const filter = useState<'all' | 'image' | 'video'>('media-filter', () => 'all')

  const fetchMedia = async (reset = false) => {
    if (loading.value) return
    if (!reset && !hasMore.value) return

    try {
      loading.value = true

      const params: Record<string, string> = {}
      if (filter.value !== 'all') {
        params.type = filter.value
      }
      if (!reset && nextCursor.value) {
        params.cursor = nextCursor.value
      }

      const query = new URLSearchParams(params).toString()
      const data = await $fetch<MediaResponse>(`/api/media${query ? '?' + query : ''}`)

      if (reset) {
        items.value = data.items
      } else {
        items.value = [...items.value, ...data.items]
      }
      nextCursor.value = data.nextCursor
      hasMore.value = data.hasMore
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      loading.value = false
    }
  }

  const setFilter = (newFilter: 'all' | 'image' | 'video') => {
    filter.value = newFilter
    nextCursor.value = null
    hasMore.value = true
    fetchMedia(true)
  }

  const reset = () => {
    items.value = []
    nextCursor.value = null
    hasMore.value = true
    filter.value = 'all'
  }

  return {
    items,
    loading,
    hasMore,
    filter,
    fetchMedia,
    setFilter,
    reset,
  }
}

