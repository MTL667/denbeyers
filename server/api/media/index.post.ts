import { z } from 'zod'
import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { MediaType } from '@prisma/client'

const createMediaSchema = z.object({
  s3Key: z.string().optional(), // Optional - can be message-only
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().positive().optional(),
  message: z.string().min(1, 'Boodschap is verplicht').max(500),
  displayName: z.string().max(100).optional(),
  consent: z.boolean(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const body = await readBody(event)
  
  // Validate request
  const parsed = createMediaSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid request: ' + parsed.error.message,
    })
  }
  
  const { s3Key, type, mimeType, sizeBytes, message, displayName, consent } = parsed.data
  
  // Consent is required
  if (!consent) {
    throw createError({
      statusCode: 400,
      message: 'Consent is required to upload media',
    })
  }
  
  // If there's a file, verify the s3Key belongs to this user
  if (s3Key && !s3Key.includes(user.id)) {
    throw createError({
      statusCode: 403,
      message: 'Invalid S3 key',
    })
  }
  
  // Create media item (not approved yet for regular users)
  const mediaItem = await prisma.mediaItem.create({
    data: {
      userId: user.id,
      type: s3Key ? (type as MediaType) : MediaType.IMAGE, // Default to IMAGE for text-only
      s3Key: s3Key || null,
      mimeType: mimeType || null,
      sizeBytes: sizeBytes || 0,
      message: message,
      displayName: displayName || user.name || 'Anoniem',
      consent,
      approved: false, // Requires moderation
      visible: true,
      isOwnerPost: false,
      isSticky: false,
    },
  })
  
  return {
    success: true,
    id: mediaItem.id,
    message: 'Je upload is ontvangen en wacht op goedkeuring. Bedankt! 💛',
  }
})

