import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' ||
    path === '/register' ||
    path === '/reset-password' ||
    path === '/onboarding' ||
    path.startsWith('/images/')

  // Get the Firebase auth token from cookies
  const token = request.cookies.get('__firebase_auth_token')?.value

  console.log('Token:', token)
  console.log('Is public path:', isPublicPath)
  console.log('Request URL:', request.url)

  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (static images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
} 