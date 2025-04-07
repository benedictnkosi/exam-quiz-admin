import { useEffect, useState } from 'react'

export const useMetaPixel = () => {
  const [pixel, setPixel] = useState<any>(null)

  useEffect(() => {
    const initializePixel = async () => {
      try {
        const ReactPixel = (await import('react-facebook-pixel')).default
        const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '629325540082757'
        ReactPixel.init(pixelId)
        setPixel(ReactPixel)
      } catch (error) {
        console.error('Error initializing Meta Pixel:', error)
      }
    }

    initializePixel()
  }, [])

  const trackEvent = (eventName: string, data = {}) => {
    if (pixel) {
      pixel.track(eventName, data)
    }
  }

  const pageView = () => {
    if (pixel) {
      pixel.pageView()
    }
  }

  return { trackEvent, pageView }
} 