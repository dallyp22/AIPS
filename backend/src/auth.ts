import { FastifyRequest, FastifyReply } from 'fastify'
import jwt, { JwtPayload, Algorithm, VerifyOptions } from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

// JWKS client for Auth0
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  requestHeaders: {}, // Optional
  timeout: 30000, // Defaults to 30s
})

// Function to get signing key
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err)
      return
    }
    const signingKey = key?.getPublicKey()
    callback(null, signingKey)
  })
}

// JWT verification options
const jwtOptions: VerifyOptions = {
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
}

// Extended request type with user info
export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    sub: string
    email: string
    email_verified: boolean
    'https://aips.app/roles'?: string[]
    [key: string]: any
  }
}

// Auth middleware
export async function authenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    console.log('🔒 Auth Debug - Domain:', process.env.AUTH0_DOMAIN)
    console.log('🔒 Auth Debug - Audience:', process.env.AUTH0_AUDIENCE)
    
    const authHeader = request.headers.authorization
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('🔒 Auth Failed: No bearer token')
      return reply.status(401).send({ 
        error: 'Unauthorized', 
        message: 'Missing or invalid authorization header' 
      })
    }

    const token = authHeader.substring(7)
    
    // Debug: Decode token without verification to see audience
    const unverifiedDecoded = jwt.decode(token, { complete: true })
    const payload = unverifiedDecoded?.payload as JwtPayload
    console.log('🔍 Token Debug - Audience in token:', payload?.aud)
    console.log('🔍 Token Debug - Expected audience:', process.env.AUTH0_AUDIENCE)

    // Verify JWT token
    const decoded = await new Promise<JwtPayload | string>((resolve, reject) => {
      jwt.verify(token, getKey, jwtOptions, (err: any, decoded: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      })
    })

    // Attach user to request
    request.user = decoded as any
    
    // Log authentication for debugging
    console.log(`✅ Authenticated user: ${request.user?.email} (${request.user?.sub})`)
    
  } catch (error) {
    console.error('🔒 Authentication failed:', error)
    return reply.status(401).send({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    })
  }
}

// Role-based authorization
export function requireRole(roles: string[]) {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      })
    }

    const userRoles = request.user['https://aips.app/roles'] || ['operator']
    const hasRequiredRole = roles.some(role => userRoles.includes(role))

    if (!hasRequiredRole) {
      console.log(`❌ Access denied for user ${request.user.email}. Required: ${roles.join(', ')}, Has: ${userRoles.join(', ')}`)
      return reply.status(403).send({ 
        error: 'Forbidden', 
        message: `Insufficient permissions. Required roles: ${roles.join(', ')}` 
      })
    }

    console.log(`✅ Access granted for user ${request.user.email} with roles: ${userRoles.join(', ')}`)
  }
}

// Optional authentication (for public endpoints that benefit from user context)
export async function optionalAuth(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      const decoded = await new Promise<JwtPayload | string | null>((resolve, reject) => {
        jwt.verify(token, getKey, jwtOptions, (err: any, decoded: any) => {
          if (err) {
            // Don't reject for optional auth, just log
            console.log('Optional auth failed:', err.message)
            resolve(null)
          } else {
            resolve(decoded)
          }
        })
      })

      if (decoded) {
        request.user = decoded as any
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth error:', error)
  }
}
