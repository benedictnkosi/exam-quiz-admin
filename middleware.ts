import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/login'

  // Get the Firebase auth token from cookies
  const token = request.cookies.get('__firebase_auth_token')?.value

  if (!isPublicPath && !token) {
    // Redirect to login if accessing a protected route without auth
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicPath && token) {
    // Redirect to home if accessing login page with auth
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 