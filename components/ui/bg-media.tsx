"use client"

import React, { useRef, useState, useEffect } from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Make sure this utility exists in your project for combining class names

// Define the type for the variant and type props
type OverlayVariant = "none" | "light" | "dark"
type MediaType = "image" | "video"

// Update the cva call with these types
const backgroundVariants = cva(
  "relative h-screen max-h-[1000px] w-full min-h-[500px] lg:min-h-[600px]",
  {
    variants: {
      overlay: {
        none: "",
        light:
          "before:absolute before:inset-0 before:bg-white before:opacity-30",
        dark: "before:absolute before:inset-0 before:bg-black before:opacity-30",
      },
      type: {
        image: "",
        video: "z-10",
      },
    },
    defaultVariants: {
      overlay: "none",
      type: "image",
    },
  }
)

interface BackgroundMediaProps {
  variant?: OverlayVariant
  type?: MediaType
  src: string
  alt?: string
  children?: React.ReactNode
  shouldPlay?: boolean
}

export const BackgroundMedia: React.FC<BackgroundMediaProps> = ({
  variant = "light",
  type = "image",
  src,
  alt = "",
  children,
  shouldPlay = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(shouldPlay)
  const mediaRef = useRef<HTMLVideoElement | null>(null)

  // Sync with shouldPlay prop
  useEffect(() => {
    if (type === "video" && mediaRef.current) {
      if (shouldPlay) {
        mediaRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        mediaRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [shouldPlay, type]);

  const toggleMediaPlay = () => {
    if (type === "video" && mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause()
      } else {
        mediaRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const mediaClasses = cn(
    backgroundVariants({ overlay: variant, type }),
    "overflow-hidden"
  )

  const renderMedia = () => {
    if (type === "video") {
      return (
        <video
          ref={mediaRef}
          aria-hidden="true"
          muted
          loop
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 pointer-events-none"
          autoPlay
          playsInline
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )
    } else {
      return (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover rounded-br-[88px]"
          loading="eager"
        />
      )
    }
  }

  return (
    <div className={mediaClasses}>
      {renderMedia()}
      {/* Dim overlay when video is paused */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 z-10 pointer-events-none ${
          isPlaying ? "opacity-0" : "opacity-50"
        }`}
      />
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
      {type === "video" && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/20 text-white/70 text-xs font-mono tracking-widest hover:bg-white/10 hover:text-white focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-colors"
                onClick={toggleMediaPlay}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">{isPlaying ? "Pause Background Video" : "Play Background Video"}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

export default BackgroundMedia
