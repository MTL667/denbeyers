import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { generatePresignedUploadUrl, generateS3Key } from '~/server/utils/s3'

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^(image\/(jpeg|jpg|png|webp)|video\/(mp4|quicktime|mov))$/i),
  size: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const config = useRuntimeConfig()
  
  const body = await readBody(event)
  
  // Validate request
  const parsed = presignSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: ' + parsed.error.message,
    })
  }
  
  const { filename, contentType, size } = parsed.data
  
  // Check file size
  const maxSize = config.maxFileSizeMb * 1024 * 1024
  if (size > maxSize) {
    throw createError({
      statusCode: 400,
      message: `File too large. Maximum size is ${config.maxFileSizeMb}MB`,
    })
  }
  
  // Determine media type
  const isVideo = contentType.startsWith('video/')
  const type = isVideo ? 'video' : 'image'
  
  // Generate S3 key
  const s3Key = generateS3Key(user.id, filename, type)
  
  // Generate presigned URL
  const uploadUrl = await generatePresignedUploadUrl(s3Key, contentType, 3600)
  
  return {
    uploadUrl,
    s3Key,
    type: type.toUpperCase(),
    expiresIn: 3600,
  }
})

