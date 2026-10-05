# Screen Sharing Guide for Chrome on Linux

## Initial Setup
1. Chrome will request screen sharing permissions automatically
2. On some Linux distributions, you may need to install additional screen sharing dependencies:
   - For Ubuntu/Debian: `sudo apt-get install xdg-desktop-portal-gtk`
   - For Fedora: `sudo dnf install xdg-desktop-portal-gtk`

## How to Share Your Screen
1. Click the "Share Screen" button in your exam interface
2. In Chrome's screen selector window, choose from:
   - Your Entire Screen
   - Application Window
   - Chrome Tab
3. Click "Share" to begin

## Troubleshooting
### If screen sharing isn't working:
1. Check Chrome permissions:
   - Click the lock icon in the address bar
   - Click "Site Settings"
   - Ensure screen sharing is set to "Allow"
2. Update Chrome:
   - Click Menu (⋮) > Help > About Google Chrome
   - Install any available updates
3. System requirements:
   - Ensure your Linux distribution supports screen sharing
   - Check if required packages are installed
   - Try running Chrome with `--enable-usermedia-screen-capturing` flag 