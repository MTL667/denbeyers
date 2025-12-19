import { requireAuth, requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { generatePresignedDownloadUrl } from '~/server/utils/s3'
import { Role } from '@prisma/client'

export default defineEventHandler(async (event) => {
  // Admin auth required
  const user = await requireAuth(event)
  requireRole(user, [Role.OWNER, Role.ADMIN])
  
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Media ID required',
    })
  }
  
  // Fetch media item (admins can see all items)
  const item = await prisma.mediaItem.findUnique({
    where: { id },
    select: {
      s3Key: true,
    },
  })
  
  if (!item || !item.s3Key) {
    throw createError({
      statusCode: 404,
      message: 'Media not found',
    })
  }
  
  // Generate presigned URL and redirect
  const presignedUrl = await generatePresignedDownloadUrl(item.s3Key, 3600)
  
  // Redirect to the presigned URL
  return sendRedirect(event, presignedUrl, 302)
})

