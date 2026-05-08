import React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface UpdateBannerProps {
  onReload: () => void
  onClose: () => void
}

export function UpdateBanner({ onReload, onClose }: UpdateBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 h-10 flex items-center justify-between shadow-sm" style={{ paddingLeft: 'calc(100% - 100% + 16px)' }}>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></div>
        <span className="text-sm text-amber-900 font-medium">New version available</span>
      </div>
      <div className="flex items-center space-x-4 flex-shrink-0">
        <button 
          onClick={onReload} 
          className="text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors cursor-pointer bg-amber-100 px-2 py-1 rounded hover:bg-amber-200"
        >
          Reload
        </button>
        <button 
          onClick={onClose} 
          className="text-xs text-amber-500 hover:text-amber-700 transition-colors cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
