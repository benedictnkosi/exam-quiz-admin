'use client'

interface ImageUploadProps {
  onFileSelect: (file: File | null, imagePath?: string) => void
  label: string
  imageName?: string
}

export default function ImageUpload({ onFileSelect, label, imageName }: ImageUploadProps) {
  return (
    <div className="mt-2">
      <label className="block text-sm text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-4">
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0] || null
            onFileSelect(file)
          }}
          accept="image/*"
          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {imageName && (
          <span className="text-sm text-gray-600">
            Current: {imageName}
          </span>
        )}
      </div>
    </div>
  )
} 