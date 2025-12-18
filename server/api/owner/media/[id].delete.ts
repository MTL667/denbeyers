import { requireAuth, requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { deleteS3Object } from '~/server/utils/s3'
import { Role } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  requireRole(user, [Role.OWNER, Role.ADMIN])
  
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Media ID is required',
    })
  }
  
  // Find the media item
  const mediaItem = await prisma.mediaItem.findUnique({
    where: { id },
  })
  
  if (!mediaItem) {
    throw createError({
      statusCode: 404,
      message: 'Media item not found',
    })
  }
  
  try {
    // Delete from S3
    await deleteS3Object(mediaItem.s3Key)
  } catch (error) {
    console.error('Failed to delete S3 object:', error)
    // Continue with database deletion even if S3 fails
  }
  
  // Delete from database
  await prisma.mediaItem.delete({
    where: { id },
  })
  
  return {
    success: true,
    message: 'Media item deleted',
  }
})

