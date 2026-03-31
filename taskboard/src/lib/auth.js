import { SignJWT, jwtVerify } from 'jose'

// Encode the secret key for use with jose
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

/**
 * Creates a signed JWT token with a 7-day expiry.
 * @param {object} payload - Data to store in the token (userId, email, name)
 * @returns {Promise<string>} Signed JWT string
 */
export async function createToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

/**
 * Verifies a JWT token and returns the payload.
 * @param {string} token - JWT string to verify
 * @returns {Promise<object|null>} Decoded payload or null if invalid
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null // Token is invalid or expired
  }
}

/**
 * Extracts and verifies the JWT from the request cookie.
 * @param {Request} request - Incoming Next.js request
 * @returns {Promise<object|null>} Decoded user payload or null
 */
export async function getUserFromRequest(request) {
  const token = request.cookies.get('token')?.value
  if (!token) return null
  return await verifyToken(token)
}
