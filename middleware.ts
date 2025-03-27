import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' ||
    path === '/register' ||
    path === '/reset-password' ||
    path === '/onboarding' ||
    path === '/privacy' ||
    path === '/info' ||
    path.startsWith('/images/')

  // Get the Firebase auth token from cookies
  const token = request.cookies.get('__firebase_auth_token')?.value

  // Handle privacy and info pages - always accessible
  if (path === '/privacy' || path === '/info') {
    return NextResponse.next()
  }

  // Handle other public paths
  if (isPublicPath) {
    // Redirect authenticated users away from public paths (except privacy and info)
    if (token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Handle protected paths
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
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