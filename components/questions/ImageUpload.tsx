'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface ImageUploadProps {
  onFileSelect: (file: File) => void
  label: string
  imageName?: string
  showReuseOption?: boolean
  lastUsedImage?: string | null
  onReuseImage?: () => void
  onResetImage?: () => void
  showResetButton?: boolean
}

export default function ImageUpload({
  onFileSelect,
  label,
  imageName,
  showReuseOption,
  lastUsedImage,
  onReuseImage,
  onResetImage,
  showResetButton
}: ImageUploadProps) {
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Add a method to reset the preview
  const resetPreview = () => {
    setPreviewUrl(null)
  }

  // Only override if onResetImage is provided
  if (onResetImage) {
    const originalReset = onResetImage
    onResetImage = () => {
      resetPreview()
      originalReset?.()
    }
  }

  return (
    <div className="mt-2">
      <div
        ref={dropZoneRef}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors"
        tabIndex={0}
        onFocus={() => {
          console.log('Element focused')
        }}
        onPaste={(e) => {
          console.log('Paste event triggered')
          const items = e.clipboardData?.items
          if (!items) {
            console.log('No clipboard data')
            return
          }

          console.log('Clipboard items:', items.length)
          for (let i = 0; i < items.length; i++) {
            console.log('Item type:', items[i].type)
            if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile()
              if (file) {
                console.log('Image file found:', file.name)
                onFileSelect(file)
                // Create preview URL
                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
              }
              break
            }
          }
        }}
      >
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-xs text-gray-500 mt-1">
          Click here and paste image from clipboard (Ctrl+V)
        </p>
        {previewUrl && (
          <div className="mt-4 relative h-48 w-full">
            <Image
              src={previewUrl}
              alt="Pasted preview"
              fill
              style={{ objectFit: 'contain' }}
              onLoad={() => {
                // Clean up the URL after the image loads
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
                // Revoke object URL to free memory
                URL.revokeObjectURL(previewUrl);
              }}
            />
          </div>
        )}
        {imageName && (
          <p className="text-sm text-blue-600 mt-2">
            Selected: {imageName}
          </p>
        )}
      </div>

      {showReuseOption && lastUsedImage && (
        <button
          type="button"
          onClick={onReuseImage}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Reuse last image: {lastUsedImage}
        </button>
      )}

      {showResetButton && imageName && (
        <button
          type="button"
          onClick={onResetImage}
          className="mt-2 ml-4 text-sm text-red-600 hover:text-red-700"
        >
          Reset image
        </button>
      )}
    </div>
  )
} 