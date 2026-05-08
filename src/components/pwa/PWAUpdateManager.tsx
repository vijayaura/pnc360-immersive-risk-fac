import React from 'react'
import { usePWAUpdate } from '@/contexts/PWAUpdateContext'
import { UpdateDialog } from './UpdateDialog'
import { UpdateBanner } from './UpdateBanner'

export function PWAUpdateManager() {
  const { showDialog, showBanner, handleReload, handleLater, handleCloseDialog, handleCloseBanner } = usePWAUpdate()

  return (
    <>
      {showDialog && (
        <UpdateDialog
          onReload={handleReload}
          onLater={handleLater}
          onClose={handleCloseDialog}
        />
      )}
      {showBanner && (
        <UpdateBanner
          onReload={handleReload}
          onClose={handleCloseBanner}
        />
      )}
    </>
  )
}
