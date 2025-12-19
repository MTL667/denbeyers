import { requireAuth, requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { Role } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await requireAuth(event)
  requireRole(user, [Role.OWNER, Role.ADMIN])
  
  const query = getQuery(event)
  
  const type = query.type as string | undefined
  const status = query.status as string | undefined
  const cursor = query.cursor as string | undefined
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  
  // Build filter conditions
  const where: any = {}
  
  if (type === 'image' || type === 'video' || type === 'text') {
    where.type = type.toUpperCase()
  }
  
  if (status === 'pending') {
    where.approved = false
  } else if (status === 'approved') {
    where.approved = true
  } else if (status === 'hidden') {
    where.visible = false
  } else if (status === 'sticky') {
    where.isSticky = true
  }
  
  // Fetch all media items for admin
  const items = await prisma.mediaItem.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: [
      { createdAt: 'desc' },
    ],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
  
  // Check if there are more items
  const hasMore = items.length > limit
  const mediaItems = hasMore ? items.slice(0, -1) : items
  
  // Build direct MinIO URL from s3Key (bucket is public)
  const buildDirectUrl = (s3Key: string | null) => {
    if (!s3Key) return null
    return `${config.s3Endpoint}/${config.s3Bucket}/${s3Key}`
  }
  
  // Use customUrl if set, otherwise use direct MinIO URL
  const itemsWithUrls = mediaItems.map((item) => ({
    id: item.id,
    type: item.type,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    message: item.message,
    displayName: item.displayName,
    customUrl: item.customUrl,
    s3Key: item.s3Key,
    consent: item.consent,
    approved: item.approved,
    visible: item.visible,
    isOwnerPost: item.isOwnerPost,
    isSticky: item.isSticky,
    stickyOrder: item.stickyOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    uploader: item.user,
    mediaUrl: item.customUrl || buildDirectUrl(item.s3Key),
  }))
  
  // Get counts for dashboard
  const counts = await prisma.mediaItem.groupBy({
    by: ['approved', 'visible', 'isSticky'],
    _count: true,
  })
  
  const stats = {
    total: await prisma.mediaItem.count(),
    pending: await prisma.mediaItem.count({ where: { approved: false } }),
    approved: await prisma.mediaItem.count({ where: { approved: true } }),
    hidden: await prisma.mediaItem.count({ where: { visible: false } }),
    sticky: await prisma.mediaItem.count({ where: { isSticky: true } }),
  }
  
  return {
    items: itemsWithUrls,
    nextCursor: hasMore ? mediaItems[mediaItems.length - 1]?.id : null,
    hasMore,
    stats,
  }
})

