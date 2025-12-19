import { requireAuth, requireRole } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { getS3Client } from '~/server/utils/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
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
      mimeType: true,
    },
  })
  
  if (!item || !item.s3Key) {
    throw createError({
      statusCode: 404,
      message: 'Media not found',
    })
  }
  
  // Fetch from S3
  const config = useRuntimeConfig()
  const client = getS3Client()
  
  try {
    const command = new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: item.s3Key,
    })
    
    const response = await client.send(command)
    
    if (!response.Body) {
      throw createError({
        statusCode: 404,
        message: 'File not found in storage',
      })
    }
    
    // Convert stream to buffer (AWS SDK v3 uses web streams)
    const bytes = await response.Body.transformToByteArray()
    
    // Set headers
    setHeaders(event, {
      'Content-Type': item.mimeType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'Content-Length': bytes.length.toString(),
    })
    
    // Return the buffer
    return Buffer.from(bytes)
  } catch (error) {
    console.error('Error fetching from S3:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch media',
    })
  }
})

