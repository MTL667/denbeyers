import * as jose from 'jose'
import type { H3Event } from 'h3'
import { Role } from '@prisma/client'
import { prisma } from './prisma'

export interface TokenPayload {
  sub: string
  azp?: string
  name?: string
  email?: string
  preferred_username?: string
  realm_access?: {
    roles: string[]
  }
  resource_access?: {
    [key: string]: {
      roles: string[]
    }
  }
}

export interface AuthUser {
  id: string
  keycloakSub: string
  name: string | null
  email: string | null
  role: Role
}

let jwks: jose.JWTVerifyGetKey | null = null

async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  if (!jwks) {
    const config = useRuntimeConfig()
    jwks = jose.createRemoteJWKSet(new URL(`${config.keycloakIssuer}/protocol/openid-connect/certs`))
  }
  return jwks
}

function extractRoleFromToken(payload: TokenPayload, clientId: string): Role {
  // Check resource_access first (client-specific roles)
  const clientRoles = payload.resource_access?.[clientId]?.roles || []
  
  // Check realm_access (realm-level roles)
  const realmRoles = payload.realm_access?.roles || []
  
  const allRoles = [...clientRoles, ...realmRoles]
  
  if (allRoles.includes('owner')) {
    return Role.OWNER
  }
  if (allRoles.includes('admin')) {
    return Role.ADMIN
  }
  return Role.USER
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const config = useRuntimeConfig()
    const jwksClient = await getJWKS()
    
    // Don't check audience - Keycloak uses 'account' as aud by default
    // Instead we verify the issuer and check azp (authorized party) matches our client
    const { payload } = await jose.jwtVerify(token, jwksClient, {
      issuer: config.keycloakIssuer,
    })
    
    // Verify the token was issued for our client (azp = authorized party)
    if (payload.azp && payload.azp !== config.keycloakClientId) {
      console.error('Token azp mismatch:', payload.azp, '!==', config.keycloakClientId)
      return null
    }
    
    return payload as TokenPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function getOrCreateUser(payload: TokenPayload): Promise<AuthUser> {
  const config = useRuntimeConfig()
  const role = extractRoleFromToken(payload, config.keycloakClientId)
  
  let user = await prisma.user.findUnique({
    where: { keycloakSub: payload.sub },
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        keycloakSub: payload.sub,
        name: payload.name || payload.preferred_username || null,
        email: payload.email || null,
        role,
      },
    })
  } else {
    // Update role and name if changed
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: payload.name || payload.preferred_username || user.name,
        email: payload.email || user.email,
        role,
      },
    })
  }
  
  return user
}

export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const token = getAuthToken(event)
  
  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required',
    })
  }
  
  const payload = await verifyToken(token)
  
  if (!payload) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token',
    })
  }
  
  return getOrCreateUser(payload)
}

export async function optionalAuth(event: H3Event): Promise<AuthUser | null> {
  const token = getAuthToken(event)
  
  if (!token) {
    return null
  }
  
  const payload = await verifyToken(token)
  
  if (!payload) {
    return null
  }
  
  return getOrCreateUser(payload)
}

export function requireRole(user: AuthUser, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    })
  }
}

function getAuthToken(event: H3Event): string | null {
  // Check Authorization header first
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  
  // Check cookie
  const cookie = getCookie(event, 'auth_token')
  if (cookie) {
    return cookie
  }
  
  return null
}

