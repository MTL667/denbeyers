import { prisma } from '~/server/utils/prisma'
import { generatePresignedDownloadUrl } from '~/server/utils/s3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Media ID required',
    })
  }
  
  // Fetch media item
  const item = await prisma.mediaItem.findUnique({
    where: { id },
    select: {
      s3Key: true,
      approved: true,
      visible: true,
      consent: true,
    },
  })
  
  if (!item || !item.s3Key) {
    throw createError({
      statusCode: 404,
      message: 'Media not found',
    })
  }
  
  // Check if item is publicly accessible
  if (!item.approved || !item.visible || !item.consent) {
    throw createError({
      statusCode: 403,
      message: 'Media not accessible',
    })
  }
  
  // Generate presigned URL and redirect
  const presignedUrl = await generatePresignedDownloadUrl(item.s3Key, 3600)
  
  // Redirect to the presigned URL
  return sendRedirect(event, presignedUrl, 302)
})

