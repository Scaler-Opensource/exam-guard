# Screen Sharing Guide for Microsoft Edge on Linux

## Initial Setup
1. Edge will automatically request screen sharing permissions
2. Some Linux distributions require additional packages:
   - Ubuntu/Debian: `sudo apt-get install xdg-desktop-portal-gtk`
   - Fedora: `sudo dnf install xdg-desktop-portal-gtk`

## How to Share Your Screen
1. Click the "Share Screen" button in your exam interface
2. In Edge's screen selector window, choose from:
   - Your Entire Screen
   - Application Window
   - Microsoft Edge Tab
3. Select your preferred sharing option
4. Click "Share" to begin

## Troubleshooting
### If screen sharing isn't working:
1. Check Edge permissions:
   - Click the lock icon in the address bar
   - Click "Site Permissions"
   - Ensure screen sharing is set to "Allow"
2. Update Edge:
   - Click Menu (...) > Help and feedback > About Microsoft Edge
   - Install any available updates
3. System checks:
   - Ensure Wayland/X11 screen sharing is supported
   - Verify required packages are installed
   - Try running Edge with `--enable-features=UseOzonePlatform --ozone-platform=wayland` for Wayland users
4. Clear browser data:
   - Press Ctrl + Shift + Delete
   - Select "Cookies and other site data"
   - Click "Clear now" 