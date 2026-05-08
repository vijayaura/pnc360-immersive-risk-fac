# PWA Update Notification System

This application now includes a Progressive Web App (PWA) update notification system that alerts users when a new version is available.

## How It Works

### Update Detection
- The service worker automatically detects when a new build is deployed
- When an update is available, users are notified through a modal dialog

### User Flow
1. **Dialog Appears**: Modal dialog shows "New Version Available" every 5 minutes
2. **User Options**:
   - **Reload Now**: Immediately reloads to get the latest version
   - **Later**: Hides dialog and shows a persistent banner at the top
3. **Persistent Banner**: 
   - Shows "New version available - Click to reload"
   - Users can click to reload when ready
   - Can be dismissed (X) to show dialog again in 5 minutes

### Features
- **5-minute reminders**: Dialog appears every 5 minutes until user updates
- **Persistent banner**: Available after clicking "Later" for convenient updates
- **User control**: Users decide when to update
- **Clean updates**: No data loss during the update process

## Testing

### Development Testing
In development mode, a small debug panel appears in the bottom-right corner showing:
- Update Available status
- Dialog visibility
- Banner visibility
- Test Update Flow button

### Production Testing
1. Deploy a new version of the application
2. Open the application in a browser
3. Wait for the service worker to detect the update
4. The dialog should appear automatically
5. Test the complete flow: dialog → later → banner → reload

## File Structure

```
src/
├── pwa/
│   ├── registerServiceWorker.ts    # Service worker registration
│   └── reminderLogic.ts           # 5-minute reminder timer
├── contexts/
│   └── PWAUpdateContext.tsx       # State management
├── components/pwa/
│   ├── UpdateDialog.tsx          # Modal dialog component
│   ├── UpdateBanner.tsx          # Persistent banner component
│   ├── PWAUpdateManager.tsx      # Main PWA component
│   └── PWATestButton.tsx         # Development testing tool
```

## Configuration

### Reminder Interval
Default: 5 minutes (300,000 ms)
Can be modified in `src/pwa/reminderLogic.ts`

### Service Worker
Configured in `vite.config.ts` with:
- Precaching of static assets
- Update detection
- Development mode disabled

## Browser Support

The PWA system works in all modern browsers that support service workers:
- Chrome/Edge 88+
- Firefox 84+
- Safari 14+

## Troubleshooting

### Update Not Detected
- Check browser console for service worker errors
- Ensure the build includes the service worker files
- Verify the service worker is registered correctly

### Dialog Not Appearing
- Check if updateAvailable state is true
- Verify the 5-minute timer is running
- Check browser developer tools for errors

### Banner Not Showing
- Ensure user clicked "Later" on the dialog
- Check if showBanner state is true
- Verify banner component is rendered

## Future Enhancements

- Configurable reminder intervals per user
- Update history tracking
- Analytics on update acceptance rates
- Custom notification styling
- Multiple reminder strategies
