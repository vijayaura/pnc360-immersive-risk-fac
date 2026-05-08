import * as React from "react"

import { cn } from '@/shared/utils/lib-utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea) {
        // Reset height to let scrollHeight recalculate based on current content 
        textarea.style.height = "auto"
        // Add 2px to account for the top and bottom borders the Tailwind inputs use
        textarea.style.height = `${Math.max(textarea.scrollHeight + 2, 40)}px`
      }
    }, [])

    React.useEffect(() => {
      adjustHeight()
    }, [props.value, adjustHeight])

    return (
      <textarea
        className={cn(
          "flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-[#78909C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y overflow-hidden",
          className
        )}
        rows={1}
        ref={textareaRef}
        onChange={(e) => {
          adjustHeight()
          onChange?.(e)
        }}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
