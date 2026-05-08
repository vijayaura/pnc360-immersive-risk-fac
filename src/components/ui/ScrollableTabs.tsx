import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/shared/utils/lib-utils"
import { Button } from "./button"

interface ScrollableTabsProps {
  children: React.ReactNode
  className?: string
}

export const ScrollableTabs = ({ children, className }: ScrollableTabsProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = React.useState(false)
  const [showRightArrow, setShowRightArrow] = React.useState(false)

  const checkScroll = React.useCallback(() => {
    const container = containerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftArrow(scrollLeft > 0)
      // Use 1px threshold to avoid floating point issues
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }, [])

  React.useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [checkScroll, children])

  const scrollBy = (offset: number) => {
    const container = containerRef.current
    if (container) {
      container.scrollBy({ left: offset, behavior: "smooth" })
    }
  }

  return (
    <div className={cn("group w-full h-fit flex flex-col", className)}>
      <div className="relative w-full h-fit">
        {/* Left Gradient & Arrow */}
        <div 
          className={cn(
            "absolute left-0 inset-y-0 z-20 w-16 pointer-events-none transition-opacity duration-300",
            showLeftArrow ? "opacity-100" : "opacity-0"
          )}
          style={{ background: 'linear-gradient(to right, hsl(var(--background)) 40%, transparent)' }}
        />
        
        {showLeftArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-30 h-8 w-8 rounded-full bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white border border-primary/20 text-primary transition-all active:scale-90"
            onClick={() => scrollBy(-200)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <div
          ref={containerRef}
          onScroll={checkScroll}
          className="w-full overflow-x-auto scrollbar-hide scroll-smooth flex items-center"
        >
          <div className="inline-flex min-w-full">
            {children}
          </div>
        </div>

        {/* Right Gradient & Arrow */}
        <div 
          className={cn(
            "absolute right-0 inset-y-0 z-20 w-16 pointer-events-none transition-opacity duration-300",
            showRightArrow ? "opacity-100" : "opacity-0"
          )}
          style={{ background: 'linear-gradient(to left, hsl(var(--background)) 40%, transparent)' }}
        />

        {showRightArrow && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-30 h-8 w-8 rounded-full bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-white border border-primary/20 text-primary transition-all active:scale-90"
            onClick={() => scrollBy(200)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
