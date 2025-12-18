import { z } from 'zod'
import { requireAuth, requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { Role } from '@prisma/client'

const updateMediaSchema = z.object({
  message: z.string().max(500).optional(),
  displayName: z.string().max(100).optional(),
  approved: z.boolean().optional(),
  visible: z.boolean().optional(),
  isSticky: z.boolean().optional(),
  stickyOrder: z.number().int().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  requireRole(user, [Role.OWNER, Role.ADMIN])
  
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Media ID is required',
    })
  }
  
  const body = await readBody(event)
  
  // Validate request
  const parsed = updateMediaSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: ' + parsed.error.message,
    })
  }
  
  // Find the media item
  const existingItem = await prisma.mediaItem.findUnique({
    where: { id },
  })
  
  if (!existingItem) {
    throw createError({
      statusCode: 404,
      message: 'Media item not found',
    })
  }
  
  const { isSticky, stickyOrder, ...updates } = parsed.data
  
  // Build the update data
  const updateData: Record<string, unknown> = { ...updates }
  
  // Handle sticky logic
  if (isSticky !== undefined) {
    updateData.isSticky = isSticky
    
    if (isSticky && !existingItem.isSticky) {
      // Check sticky limit when enabling sticky
      const stickyCount = await prisma.mediaItem.count({
        where: { isSticky: true },
      })
      
      if (stickyCount >= config.maxStickyItems) {
        throw createError({
          statusCode: 400,
          message: `Maximum number of sticky items (${config.maxStickyItems}) reached`,
        })
      }
      
      // Get next sticky order
      const lastSticky = await prisma.mediaItem.findFirst({
        where: { isSticky: true },
        orderBy: { stickyOrder: 'desc' },
        select: { stickyOrder: true },
      })
      updateData.stickyOrder = (lastSticky?.stickyOrder ?? 0) + 1
    } else if (!isSticky) {
      // Clear sticky order when disabling sticky
      updateData.stickyOrder = null
    }
  }
  
  // Allow manual sticky order override
  if (stickyOrder !== undefined) {
    updateData.stickyOrder = stickyOrder
  }
  
  // Update the media item
  const mediaItem = await prisma.mediaItem.update({
    where: { id },
    data: updateData,
  })
  
  return {
    success: true,
    item: {
      id: mediaItem.id,
      approved: mediaItem.approved,
      visible: mediaItem.visible,
      isSticky: mediaItem.isSticky,
      stickyOrder: mediaItem.stickyOrder,
    },
  }
})

