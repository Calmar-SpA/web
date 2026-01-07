'use client'

import { motion, useInView, useAnimation } from 'framer-motion'
import { ReactNode, useEffect, useRef } from 'react'

interface RevealProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

export function Reveal({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 0.5,
  className = '',
  once = true
}: RevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once })
  const mainControls = useAnimation()
  
  useEffect(() => {
    if (isInView) {
      mainControls.start("visible")
    }
  }, [isInView, mainControls])
  
  const variants = {
    hidden: { 
      opacity: 0, 
      y: direction === 'up' ? 75 : direction === 'down' ? -75 : 0,
      x: direction === 'left' ? 75 : direction === 'right' ? -75 : 0 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      x: 0,
      transition: { duration, delay, ease: "easeOut" as any }
    }
  }

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        variants={variants}
        initial="hidden"
        animate={mainControls}
      >
        {children}
      </motion.div>
    </div>
  )
}
