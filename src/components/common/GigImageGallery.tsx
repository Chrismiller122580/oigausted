'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface GigImageGalleryProps {
  images: string[]
  alt: string
  className?: string
  priority?: boolean
}

const frameClass =
  'rounded-3xl overflow-hidden shadow-xl bg-muted flex items-center justify-center relative'
const mainSizes = '(max-width: 768px) 100vw, 60vw'

function GalleryImage({
  src,
  alt,
  priority = false,
  className = 'object-contain',
}: {
  src: string
  alt: string
  priority?: boolean
  className?: string
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={mainSizes}
      priority={priority}
      className={className}
    />
  )
}

export function GigImageGallery({
  images,
  alt,
  className = '',
  priority = false,
}: GigImageGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || el.children.length === 0) return
    const childWidth = (el.children[0] as HTMLElement).offsetWidth
    if (!childWidth) return
    const index = Math.round(el.scrollLeft / childWidth)
    setActiveIndex(Math.min(Math.max(index, 0), images.length - 1))
  }, [images.length])

  const scrollTo = (index: number) => {
    const el = scrollRef.current
    if (!el || el.children.length === 0) return
    const childWidth = (el.children[0] as HTMLElement).offsetWidth
    el.scrollTo({ left: childWidth * index, behavior: 'smooth' })
    setActiveIndex(index)
  }

  if (!images.length) return null

  if (images.length === 1) {
    return (
      <div className={`${frameClass} aspect-[4/3] max-h-[min(70vh,560px)] ${className}`}>
        <GalleryImage src={images[0]} alt={alt} priority={priority} />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="md:hidden relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-3xl shadow-xl bg-muted [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="w-full flex-shrink-0 snap-center relative aspect-[4/3] max-h-[min(70vh,560px)] bg-muted"
            >
              <GalleryImage
                src={url}
                alt={`${alt} - foto ${index + 1}`}
                priority={priority && index === 0}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollTo(Math.max(activeIndex - 1, 0))}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background/90 border shadow"
          aria-label="Foto anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollTo(Math.min(activeIndex + 1, images.length - 1))}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background/90 border shadow"
          aria-label="Foto siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-6 bg-orange-600' : 'w-2 bg-muted-foreground/30'
              }`}
              aria-label={`Ir a foto ${index + 1}`}
            />
          ))}
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-1">
          Desliza para ver {images.length} fotos
        </p>
      </div>

      <div className="hidden md:block space-y-3">
        <div className={`${frameClass} aspect-[4/3] max-h-[min(70vh,560px)]`}>
          <GalleryImage
            src={images[activeIndex]}
            alt={`${alt} - foto ${activeIndex + 1}`}
            priority={priority && activeIndex === 0}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((url, index) => (
            <button
              key={`${url}-thumb-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 bg-muted transition ${
                index === activeIndex
                  ? 'border-orange-600'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={url} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}