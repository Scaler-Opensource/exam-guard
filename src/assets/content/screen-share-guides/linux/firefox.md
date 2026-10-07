# Screen Sharing Guide for Firefox on Linux

## Initial Setup
1. Firefox will request screen sharing permissions when needed
2. Some Linux distributions require additional packages:
   - Ubuntu/Debian: `sudo apt-get install xdg-desktop-portal-gtk`
   - Fedora: `sudo dnf install xdg-desktop-portal-gtk`

## How to Share Your Screen
1. Click the "Share Screen" button in your exam interface
2. In the Firefox sharing dialog, select from:
   - Entire Screen
   - Application Window
   - Browser Tab
3. Click "Allow" to start sharing

## Troubleshooting
### If screen sharing isn't working:
1. Check Firefox permissions:
   - Click the shield icon in the address bar
   - Ensure screen sharing is allowed
2. Verify about:config settings:
   - Type "about:config" in address bar
   - Search for "media.getusermedia.screensharing.enabled"
   - Set to "true"
3. System checks:
   - Ensure Wayland/X11 screen sharing is supported
   - Verify required packages are installed
   - Try running Firefox with MOZ_ENABLE_WAYLAND=1 for Wayland users 