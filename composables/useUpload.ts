interface PresignResponse {
  uploadUrl: string
  s3Key: string
  type: 'IMAGE' | 'VIDEO'
  expiresIn: number
}

interface UploadResult {
  success: boolean
  id?: string
  message: string
}

export const useUpload = () => {
  const uploading = useState('upload-uploading', () => false)
  const progress = useState('upload-progress', () => 0)
  const error = useState<string | null>('upload-error', () => null)

  const uploadMedia = async (
    file: File,
    options: {
      message?: string
      displayName?: string
      consent: boolean
      isOwnerPost?: boolean
      isSticky?: boolean
    }
  ): Promise<UploadResult> => {
    try {
      uploading.value = true
      progress.value = 0
      error.value = null

      const isOwnerUpload = options.isOwnerPost

      // Step 1: Get presigned URL
      const presignEndpoint = isOwnerUpload ? '/api/owner/media/presign' : '/api/media/presign'
      const presignData = await $fetch<PresignResponse>(presignEndpoint, {
        method: 'POST',
        body: {
          filename: file.name,
          contentType: file.type,
          size: file.size,
        },
      })

      progress.value = 10

      // Step 2: Upload to S3
      const uploadResponse = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload to S3 failed')
      }

      progress.value = 80

      // Step 3: Create media record
      const createEndpoint = isOwnerUpload ? '/api/owner/media' : '/api/media'
      const result = await $fetch<UploadResult>(createEndpoint, {
        method: 'POST',
        body: {
          s3Key: presignData.s3Key,
          type: presignData.type,
          mimeType: file.type,
          sizeBytes: file.size,
          message: options.message,
          displayName: options.displayName,
          consent: options.consent,
          isSticky: options.isSticky,
        },
      })

      progress.value = 100

      return result
    } catch (err: any) {
      error.value = err.message || 'Upload failed'
      return {
        success: false,
        message: error.value || 'Upload failed',
      }
    } finally {
      uploading.value = false
    }
  }

  const reset = () => {
    uploading.value = false
    progress.value = 0
    error.value = null
  }

  return {
    uploading,
    progress,
    error,
    uploadMedia,
    reset,
  }
}

