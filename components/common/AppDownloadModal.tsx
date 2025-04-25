'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface AppDownloadModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
            <div className="bg-[#1B1464] rounded-xl p-6 max-w-md w-full">
                <div className="flex justify-end mb-4">
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 relative">
                        <Image
                            src="/images/icon.png"
                            alt="App Icon"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Download Our App</h3>
                    <p className="text-gray-300 mb-6">
                        Get a better experience and access to more features by downloading our mobile app!
                    </p>
                    <div className="flex flex-col gap-3">
                        <a
                            href="https://apps.apple.com/za/app/past-papers-exam-quiz/id6742684696"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-[#1B1464] py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Download on App Store
                        </a>
                        <a
                            href="https://play.google.com/store/apps/details?id=za.co.examquizafrica"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-[#1B1464] py-3 px-6 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                        >
                            Download on Google Play
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
} 