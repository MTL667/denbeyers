export type { Role, MediaType } from '@prisma/client'

export interface MediaItem {
  id: string
  type: 'IMAGE' | 'VIDEO'
  mimeType: string
  sizeBytes?: number
  message: string | null
  displayName: string | null
  consent?: boolean
  approved?: boolean
  visible?: boolean
  isOwnerPost: boolean
  isSticky: boolean
  stickyOrder?: number | null
  createdAt: string
  updatedAt?: string
  mediaUrl: string
  uploader?: {
    id: string
    name: string | null
    email: string | null
  }
}

export interface AuthUser {
  id: string
  name: string | null
  email: string | null
  role: 'USER' | 'ADMIN' | 'OWNER'
}

export interface AuthSession {
  authenticated: boolean
  user: AuthUser | null
}

export interface MediaResponse {
  items: MediaItem[]
  nextCursor: string | null
  hasMore: boolean
}

export interface AdminMediaResponse extends MediaResponse {
  stats: {
    total: number
    pending: number
    approved: number
    hidden: number
    sticky: number
  }
}

export interface PresignResponse {
  uploadUrl: string
  s3Key: string
  type: 'IMAGE' | 'VIDEO'
  expiresIn: number
}

export interface UploadResult {
  success: boolean
  id?: string
  message: string
}

