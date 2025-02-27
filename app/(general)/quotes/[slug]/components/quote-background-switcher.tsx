"use client"

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Check, ImageIcon, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Gallery } from "@prisma/client";

// Image cache for preloaded thumbnails
const preloadedThumbnails = new Map<string, boolean>();

interface QuoteBackgroundSwitcherProps {
  backgrounds: Array<Gallery & {
    isActive?: boolean;
    isBackground?: boolean;
  }>;
  activeBackground: Gallery | null;
  onBackgroundChange: (background: Gallery) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function QuoteBackgroundSwitcher({
  backgrounds,
  activeBackground,
  onBackgroundChange,
  isLoading = false,
  className
}: QuoteBackgroundSwitcherProps) {
  // Track loading state for individual images
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // Reference to previously selected background
  const previousBackgroundRef = useRef<string | null>(null);

  // Create a default background option
  const defaultBackground: Gallery = {
    id: "default",
    url: "",
    publicId: "default",
    title: "Default",
    description: null,
    altText: null,
    format: null,
    width: null,
    height: null,
    bytes: null,
    type: "SOLID",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    isPublic: true,
    isGlobal: false,
    usageCount: 0
  } as Gallery;

  // Preload thumbnails when component mounts
  useEffect(() => {
    // Preload the most important images first (active and first few)
    const priorityImages = backgrounds.filter(
      bg => bg.id === activeBackground?.id || 
      backgrounds.indexOf(bg) < 4
    );
    
    priorityImages.forEach(background => {
      if (!preloadedThumbnails.has(background.url)) {
        const img = new Image();
        img.onload = () => {
          preloadedThumbnails.set(background.url, true);
          // Update loading state to reflect loaded image
          setLoadingStates(prev => ({
            ...prev,
            [background.id]: false
          }));
        };
        img.src = background.url;
        // Set initial loading state
        setLoadingStates(prev => ({
          ...prev,
          [background.id]: true
        }));
      }
    });
  }, [backgrounds, activeBackground]);

  // Handle background change with loading state
  const handleBackgroundChange = async (background: Gallery) => {
    previousBackgroundRef.current = activeBackground?.id || null;
    
    // Set loading state for this specific background
    if (!preloadedThumbnails.has(background.url) && background.id !== "default") {
      setLoadingStates(prev => ({
        ...prev,
        [background.id]: true
      }));
    }
    
    // Call the parent handler
    await onBackgroundChange(background);
    
    // After change, mark as loaded
    if (background.id !== "default") {
      preloadedThumbnails.set(background.url, true);
      setLoadingStates(prev => ({
        ...prev,
        [background.id]: false
      }));
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Background</h3>
          <p className="text-sm text-muted-foreground">
            Choose a background for your quote
          </p>
        </div>
      </div>

      {/* Enhanced Background Grid */}
      <ScrollArea className="h-[280px] rounded-md border">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
          {/* Default Background Option */}
          <button
            onClick={() => handleBackgroundChange(defaultBackground)}
            disabled={isLoading}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg",
              "bg-gradient-to-br from-primary/10 to-primary/5",
              "border-2 transition-all duration-300 ease-in-out",
              (!activeBackground || activeBackground.id === "default")
                ? "border-primary ring-2 ring-primary/30"
                : "border-transparent hover:border-primary/50",
              "hover:shadow-lg hover:scale-[1.02]",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-foreground/70">Default</span>
            </div>
            {(!activeBackground || activeBackground.id === "default") && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                <Check className="h-6 w-6 text-primary" />
              </div>
            )}
          </button>

          {/* Enhanced Background Options */}
          {backgrounds.map((background) => {
            const isImageLoading = loadingStates[background.id] === true;
            const wasSelected = previousBackgroundRef.current === background.id;
            const isSelected = activeBackground?.id === background.id;
            
            return (
              <button
                key={background.id}
                onClick={() => handleBackgroundChange(background)}
                disabled={isLoading}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg",
                  "border-2 transition-all duration-300 ease-in-out",
                  "hover:shadow-lg hover:scale-[1.02]",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent hover:border-primary/50",
                  isLoading && "opacity-50 cursor-not-allowed",
                  wasSelected && "animate-pulse-once"
                )}
              >
                {/* Loading Spinner for Individual Images */}
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                )}

                {/* Improved Image Preview with Cache Awareness */}
                <Image
                  src={background.url}
                  alt={background.title || "Background option"}
                  fill
                  className={cn(
                    "object-cover transition-all duration-500",
                    "group-hover:scale-110",
                    (isImageLoading || isLoading) && "blur-sm brightness-90",
                    preloadedThumbnails.has(background.url) ? "opacity-100" : "opacity-0"
                  )}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  priority={isSelected}
                  onLoadingComplete={() => {
                    // Mark as loaded when Next.js finishes loading the image
                    preloadedThumbnails.set(background.url, true);
                    setLoadingStates(prev => ({
                      ...prev,
                      [background.id]: false
                    }));
                  }}
                />

                {/* Enhanced Selection Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px]
                                flex items-center justify-center transition-all duration-300">
                    <Check className="h-6 w-6 text-primary drop-shadow-lg" />
                  </div>
                )}

                {/* Improved Hover Overlay */}
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center",
                  "bg-black/60 backdrop-blur-[1px]",
                  "opacity-0 transition-all duration-300",
                  "group-hover:opacity-100",
                  isImageLoading && "hidden"
                )}>
                  <p className="text-sm font-medium text-white/90 drop-shadow-lg">
                    {preloadedThumbnails.has(background.url) ? "Select Background" : "Loading..."}
                  </p>
                </div>
                
                {/* Cached Indicator (optional) */}
                {preloadedThumbnails.has(background.url) && !isImageLoading && !isSelected && (
                  <div className="absolute top-1 right-1 bg-primary/20 rounded-full p-1">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Global Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm
                      flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Empty State */}
      {backgrounds.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No backgrounds available
          </p>
          <p className="text-xs text-muted-foreground">
            Add some backgrounds to get started
          </p>
        </div>
      )}
    </div>
  );
}