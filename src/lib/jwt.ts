import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default_fallback_secret_12345!'
)

export async function signStudentSession(studentId: string): Promise<string> {
  const jwt = await new SignJWT({ student_id: studentId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
  
  return jwt
}

export async function verifyStudentSession(token: string): Promise<{ student_id: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { student_id: string }
  } catch (error) {
    return null
  }
}
