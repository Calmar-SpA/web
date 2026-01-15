'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from '@/navigation'
import { Button } from '@calmar/ui'
import { ArrowRight } from 'lucide-react'

interface VideoHeroProps {
  videoUrl: string | null
  title?: string
  primaryButtonText?: string
  primaryButtonHref?: string
  secondaryButtonText?: string
  secondaryButtonHref?: string
}

export function VideoHero({
  videoUrl,
  title = "Hidratación avanzada y suplementación de alto nivel para el atleta moderno",
  primaryButtonText = "Explorar tienda",
  primaryButtonHref = "/shop",
  secondaryButtonText = "Nuestro Origen",
  secondaryButtonHref = "/about"
}: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoUrl) return

    const handleTimeUpdate = () => {
      // Start fade to black 1 second before video ends
      if (video.duration - video.currentTime <= 1) {
        setIsFading(true)
      }
    }

    const handleEnded = () => {
      // Reset to beginning with fade still active
      video.currentTime = 0
      video.play()
      
      // Remove fade after a short delay to create smooth transition
      setTimeout(() => {
        setIsFading(false)
      }, 500)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [videoUrl])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Video Background */}
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={videoUrl}
            autoPlay
            muted
            playsInline
            loop={false}
          />
          
          {/* Fade overlay for smooth loop transition */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none ${
              isFading ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        /* Fallback gradient background when no video */
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 w-[90%] max-w-5xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-medium text-white tracking-tight leading-tight mb-8 md:mb-12"
        >
          {title.split('\n').map((line, index) => (
            <span key={index} className={index > 0 ? "block mt-2 md:mt-4 text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium normal-case tracking-normal font-sans" : ""}>
              {line}
            </span>
          ))}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href={primaryButtonHref}>
            <Button 
              size="lg" 
              className="h-14 sm:h-16 px-6 sm:px-8 bg-white hover:bg-white/90 text-black font-black text-base sm:text-xl rounded-none tracking-tight w-full sm:w-auto"
            >
              {primaryButtonText} <ArrowRight className="ml-2 h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </Link>
          
          <Link href={secondaryButtonHref}>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 sm:h-16 px-6 sm:px-8 border-white/30 text-white hover:bg-white/10 font-bold tracking-widest text-xs uppercase rounded-none w-full sm:w-auto"
            >
              {secondaryButtonText}
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="animate-bounce">
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
        </div>
      </motion.div>
    </section>
  )
}
