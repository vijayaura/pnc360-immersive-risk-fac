import React from 'react'
import { Button } from '@/components/ui/button'
import { usePWAUpdate } from '@/contexts/PWAUpdateContext'

export function PWATestButton() {
  const { updateAvailable, showDialog, showBanner } = usePWAUpdate()

  // This is for testing purposes only - in production, updates are detected automatically
  const simulateUpdate = () => {
    // Trigger the update flow manually for testing
    window.location.reload()
  }

  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-2 rounded text-xs">
        <div>PWA Status:</div>
        <div>Update Available: {updateAvailable ? 'Yes' : 'No'}</div>
        <div>Dialog: {showDialog ? 'Visible' : 'Hidden'}</div>
        <div>Banner: {showBanner ? 'Visible' : 'Hidden'}</div>
        <Button size="sm" onClick={simulateUpdate} className="mt-2">
          Test Update Flow 2
        </Button>
      </div>
    )
  }

  return null
}
