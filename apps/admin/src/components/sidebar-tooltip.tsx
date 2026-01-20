'use client'

import { useState, useRef, useEffect, cloneElement, isValidElement } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  children: React.ReactNode
  content: string
  enabled?: boolean
}

export function SidebarTooltip({ children, content, enabled = true }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showTooltip = (e: React.MouseEvent) => {
    if (!enabled) return
    
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 12
    })
    setIsVisible(true)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  // Clone the child element and add event handlers
  if (isValidElement(children)) {
    const child = cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onMouseEnter: (e: React.MouseEvent) => {
        showTooltip(e)
        const originalHandler = (children as React.ReactElement<Record<string, unknown>>).props.onMouseEnter as ((e: React.MouseEvent) => void) | undefined
        if (originalHandler) originalHandler(e)
      },
      onMouseLeave: (e: React.MouseEvent) => {
        hideTooltip()
        const originalHandler = (children as React.ReactElement<Record<string, unknown>>).props.onMouseLeave as ((e: React.MouseEvent) => void) | undefined
        if (originalHandler) originalHandler(e)
      }
    })

    return (
      <>
        {child}
        {mounted && isVisible && enabled && createPortal(
          <div
            className="fixed z-[99999] pointer-events-none"
            style={{
              top: position.top,
              left: position.left,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="
              px-3 py-2 rounded-lg
              bg-slate-900 text-white text-sm font-medium
              shadow-xl border border-white/10
              animate-in fade-in-0 zoom-in-95 duration-150
            ">
              {content}
              {/* Arrow */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  return <>{children}</>
}
