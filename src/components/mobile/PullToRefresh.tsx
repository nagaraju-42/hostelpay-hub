'use client'

import React, { useState, useEffect, useRef } from 'react'

interface Props {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const [pullDist, setPullDist] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const MAX_PULL = 100
  const THRESHOLD = 70

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY
        isDragging.current = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || refreshing) return
      
      const y = e.touches[0].clientY
      const dist = y - startY.current
      
      if (dist > 0 && el.scrollTop === 0) {
        // Prevent default scroll
        if (e.cancelable) e.preventDefault()
        setPullDist(Math.min(dist * 0.4, MAX_PULL)) // Add friction
      }
    }

    const handleTouchEnd = async () => {
      if (!isDragging.current || refreshing) return
      isDragging.current = false

      if (pullDist >= THRESHOLD) {
        setRefreshing(true)
        setPullDist(THRESHOLD) // Lock at threshold while loading
        try {
          await onRefresh()
        } finally {
          setRefreshing(false)
          setPullDist(0)
        }
      } else {
        setPullDist(0)
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDist, refreshing, onRefresh])

  return (
    <div 
      ref={containerRef} 
      className="mobile-scroll"
      style={{ position: 'relative', flex: 1, overflowY: 'auto' }}
    >
      <div 
        style={{ 
          position: 'absolute', top: 0, left: 0, right: 0,
          height: pullDist, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', transition: isDragging.current ? 'none' : 'height 0.3s ease-out'
        }}
      >
        {refreshing ? (
          <div style={{ fontSize: 24, animation: 'spin 1s linear infinite' }}>⏳</div>
        ) : (
          <div style={{ 
            fontSize: 24, 
            transform: `rotate(${pullDist * 2}deg)`,
            opacity: pullDist / THRESHOLD
          }}>
            ⬇️
          </div>
        )}
      </div>

      <div 
        style={{ 
          transform: `translateY(${pullDist}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
          height: '100%'
        }}
      >
        {children}
      </div>
    </div>
  )
}
