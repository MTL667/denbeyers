import { z } from 'zod'
import { requireAuth, requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { MediaType, Role } from '@prisma/client'

const createOwnerMediaSchema = z.object({
  s3Key: z.string().min(1),
  type: z.enum(['IMAGE', 'VIDEO']),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  message: z.string().max(500).optional(),
  displayName: z.string().max(100).optional(),
  isSticky: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  requireRole(user, [Role.OWNER, Role.ADMIN])
  
  const config = useRuntimeConfig()
  const body = await readBody(event)
  
  // Validate request
  const parsed = createOwnerMediaSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: ' + parsed.error.message,
    })
  }
  
  const { s3Key, type, mimeType, sizeBytes, message, displayName, isSticky } = parsed.data
  
  // Check sticky limit if making sticky
  if (isSticky) {
    const stickyCount = await prisma.mediaItem.count({
      where: { isSticky: true },
    })
    
    if (stickyCount >= config.maxStickyItems) {
      throw createError({
        statusCode: 400,
        message: `Maximum number of sticky items (${config.maxStickyItems}) reached`,
      })
    }
  }
  
  // Get next sticky order if making sticky
  let stickyOrder: number | null = null
  if (isSticky) {
    const lastSticky = await prisma.mediaItem.findFirst({
      where: { isSticky: true },
      orderBy: { stickyOrder: 'desc' },
      select: { stickyOrder: true },
    })
    stickyOrder = (lastSticky?.stickyOrder ?? 0) + 1
  }
  
  // Create owner media item (auto-approved)
  const mediaItem = await prisma.mediaItem.create({
    data: {
      userId: user.id,
      type: type as MediaType,
      s3Key,
      mimeType,
      sizeBytes,
      message: message || null,
      displayName: displayName || user.name || 'Nick',
      consent: true,
      approved: true, // Auto-approved for owner/admin
      visible: true,
      isOwnerPost: true,
      isSticky: isSticky || false,
      stickyOrder,
    },
  })
  
  return {
    success: true,
    id: mediaItem.id,
    message: 'Post aangemaakt! 💛',
  }
})

