import React from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface UpdateDialogProps {
  onReload: () => void
  onLater: () => void
  onClose: () => void
}

export function UpdateDialog({ onReload, onLater, onClose }: UpdateDialogProps) {
  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>New Version Available</AlertDialogTitle>
          <AlertDialogDescription>
            A new version of the application is available. Would you like to reload now?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-end space-x-2">
          <AlertDialogCancel onClick={onLater}>Later</AlertDialogCancel>
          <AlertDialogAction onClick={onReload}>Reload Now</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
