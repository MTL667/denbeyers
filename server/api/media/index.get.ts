import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const type = query.type as string | undefined
  const cursor = query.cursor as string | undefined
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  
  // Build filter conditions
  const where: any = {
    approved: true,
    visible: true,
    consent: true,
  }
  
  if (type === 'image' || type === 'video') {
    where.type = type.toUpperCase()
  }
  
  // Fetch media items with sticky items first, then by date
  const items = await prisma.mediaItem.findMany({
    where,
    take: limit + 1, // Fetch one extra to check if there's more
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0, // Skip the cursor item itself
    orderBy: [
      { isSticky: 'desc' },
      { stickyOrder: 'asc' },
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      type: true,
      s3Key: true,
      customUrl: true,
      mimeType: true,
      message: true,
      displayName: true,
      isOwnerPost: true,
      isSticky: true,
      createdAt: true,
    },
  })
  
  // Check if there are more items
  const hasMore = items.length > limit
  const mediaItems = hasMore ? items.slice(0, -1) : items
  
  // Build direct MinIO URL from s3Key (bucket is public)
  const buildDirectUrl = (s3Key: string | null) => {
    if (!s3Key) return null
    // Format: https://endpoint/bucket/key
    return `${config.s3Endpoint}/${config.s3Bucket}/${s3Key}`
  }
  
  // Use customUrl if set, otherwise use direct MinIO URL
  const itemsWithUrls = mediaItems.map((item) => ({
    ...item,
    mediaUrl: item.customUrl || buildDirectUrl(item.s3Key),
  }))
  
  return {
    items: itemsWithUrls,
    nextCursor: hasMore ? mediaItems[mediaItems.length - 1]?.id : null,
    hasMore,
  }
})

