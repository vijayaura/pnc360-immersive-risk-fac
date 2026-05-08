const REMINDER_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function startReminderTimer(onShowDialog: () => void): NodeJS.Timeout {
  return setInterval(() => {
    onShowDialog()
  }, REMINDER_INTERVAL)
}

export function clearReminderTimer(timer: NodeJS.Timeout | null) {
  if (timer) {
    clearInterval(timer)
  }
}
