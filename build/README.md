# Build Resources

This directory contains build resources for distributing the Countdown Timer app.

## Icons

You need to add app icons in the following formats:

- **macOS**: `icon.icns` (1024x1024 png converted to icns)
- **Windows**: `icon.ico` (256x256 png converted to ico)
- **Linux**: `icon.png` (512x512 or 1024x1024 png)

### Creating Icons

You can use online tools or command-line utilities:

**macOS (creating .icns):**
```bash
# Using iconutil (built into macOS)
# 1. Create iconset folder with various sizes
# 2. Run: iconutil -c icns icon.iconset
```

**Windows (creating .ico):**
Use online converters like:
- https://convertio.co/png-ico/
- https://cloudconvert.com/png-to-ico

**Or simply use the same PNG for all platforms temporarily:**
```bash
cp your-icon.png build/icon.png
```

## Entitlements

The `entitlements.mac.plist` file is required for macOS code signing and notarization.
It's already configured with necessary permissions for Electron apps.

## Code Signing (macOS)

For production builds on macOS, you'll need:
1. An Apple Developer account ($99/year)
2. A Developer ID Application certificate
3. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your-password
   ```

For testing, you can skip code signing by setting:
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
```
