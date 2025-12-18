import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

let s3Client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!s3Client) {
    const config = useRuntimeConfig()
    s3Client = new S3Client({
      endpoint: config.s3Endpoint,
      region: config.s3Region,
      credentials: {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey,
      },
      forcePathStyle: true, // Required for MinIO
    })
  }
  return s3Client
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = useRuntimeConfig()
  const client = getS3Client()

  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn })
}

export async function generatePresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = useRuntimeConfig()
  const client = getS3Client()

  const command = new GetObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn })
}

export async function deleteS3Object(key: string): Promise<void> {
  const config = useRuntimeConfig()
  const client = getS3Client()

  const command = new DeleteObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
  })

  await client.send(command)
}

export function generateS3Key(userId: string, filename: string, type: 'image' | 'video'): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `uploads/${type}s/${userId}/${timestamp}-${sanitizedFilename}`
}

