import { prisma } from '~/server/utils/prisma'
import { getS3Client } from '~/server/utils/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'

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
      mimeType: true,
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
    
    // Set headers
    setHeaders(event, {
      'Content-Type': item.mimeType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      'Access-Control-Allow-Origin': '*',
    })
    
    // Stream the file
    return response.Body
  } catch (error) {
    console.error('Error fetching from S3:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch media',
    })
  }
})

