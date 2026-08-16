import { useState } from 'react'
import type { TripImage as ImageData } from '../types/trip'

export function TripImage({ image, className = '' }: { image: ImageData; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className={`trip-image-fallback ${className}`} role="img" aria-label={image.alt}><span>{image.alt}</span></div>
  return <picture className={className}>{image.fallbackSrc && <source srcSet={image.src} type="image/webp" />}<img src={image.fallbackSrc ?? image.src} alt={image.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} /></picture>
}
