import { prisma } from '~/server/utils/prisma'
import { generatePresignedDownloadUrl } from '~/server/utils/s3'

export default defineEventHandler(async (event) => {
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
  
  // Generate signed URLs for each item
  const itemsWithUrls = await Promise.all(
    mediaItems.map(async (item) => ({
      ...item,
      mediaUrl: await generatePresignedDownloadUrl(item.s3Key, 3600),
    }))
  )
  
  return {
    items: itemsWithUrls,
    nextCursor: hasMore ? mediaItems[mediaItems.length - 1]?.id : null,
    hasMore,
  }
})

