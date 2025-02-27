'use client'

import { useState, useEffect } from 'react'

interface ImageToLatexProps {
  onLatexGenerated: (latex: string) => void
}

export default function ImageToLatex({ onLatexGenerated }: ImageToLatexProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageItem = Array.from(items).find(item => item.type.startsWith('image/'))
      if (!imageItem) return

      setLoading(true)
      setError('')

      try {
        const file = imageItem.getAsFile()
        if (!file) return

        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = async () => {
          try {
            const base64String = (reader.result as string).split(',')[1]

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: "You are an AI that extracts LaTeX from images of chemical or mathematical equations. Strictly follow these rules:\n1. Return only the LaTeX formula—no extra text or explanations.\n2. Do not use \\text{} for chemical elements.\n3. Format it as an inline equation with $...$.\n4. Use a single backslash for LaTeX commands.\n5. Replace new lines with \\newline if needed."
                  },
                  {
                    role: "user",
                    content: [
                      {
                        type: "image_url",
                        image_url: {
                          url: `data:image/jpeg;base64,${base64String}`
                        }
                      }
                    ]
                  }
                ]
              })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error?.message || 'Failed to convert image')

            let latex = data.choices[0].message.content
              .replace(/^\\\(/g, '$')     // Replace leading \( with $
              .replace(/\\\)$/g, '$')     // Replace trailing \) with $
              .replace(/\n/g, '\\newline ')  //replace /n with new line
              .replace(/\\\\/g, '\\') // replace \\ with a single \
              .trim()

            latex = latex.replace(/\\\(|\\\)/g, '').replace(/\$/g, '')  // Remove all $ symbols  // Remove all \( and \) from anywhere in the string
            latex = "$" + latex + "$"
            await navigator.clipboard.writeText(latex)
            onLatexGenerated(latex)
          } catch (err) {
            console.error('Error converting image:', err)
            setError('Failed to convert image to LaTeX')
          } finally {
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Error reading file:', err)
        setError('Failed to read image')
        setLoading(false)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onLatexGenerated])

  return (
    <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 mb-2">
          {loading ? 'Converting...' : 'Paste an image (Ctrl+V) to convert it to LaTeX'}
        </p>

        {loading && (
          <div className="flex flex-col items-center space-y-2 my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
            <p className="text-sm text-blue-600">Converting image to LaTeX...</p>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <p className="mt-2 text-sm text-gray-500">
          {loading ? 'Please wait...' : 'The LaTeX will be copied to your clipboard'}
        </p>
      </div>
    </div>
  )
} 