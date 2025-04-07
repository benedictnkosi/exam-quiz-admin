// Meta Pixel tracking utilities
declare global {
  interface Window {
    fbq: any;
  }
}

export const initMetaPixel = (pixelId: string) => {
  if (typeof window !== 'undefined') {
    // Initialize the Meta Pixel
    window.fbq = function() {
      window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
    };
    window.fbq.push = window.fbq;
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window.fbq.queue = [];
    
    // Load the Meta Pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://connect.facebook.net/en_US/fbevents.js`;
    document.head.appendChild(script);

    // Initialize the pixel
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }
};

export const trackMetaPixelEvent = (eventName: string, eventData?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, eventData);
  }
}; 