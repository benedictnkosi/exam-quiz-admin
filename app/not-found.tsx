import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
                <div className="space-y-4">
                    <h1 className="text-6xl font-bold text-gray-900">404</h1>
                    <h2 className="text-2xl font-semibold text-gray-700">Page Not Found</h2>
                    <p className="text-gray-600">
                        The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>

                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#1e1b4b] hover:bg-[#312e81] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e1b4b] transition-colors duration-200"
                    >
                        Go to Home
                    </Link>
                </div>
            </div>
        </div>
    )
} 