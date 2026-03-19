# Distribution & Auto-Update Setup Guide

This guide explains how to build, distribute, and auto-update your Countdown Timer app.

## 🎯 What's Been Added

### 1. Auto-Updates (via GitHub Releases)
- ✅ Automatic update checking on startup
- ✅ Manual "Check for Updates" in Help menu
- ✅ Background downloads
- ✅ User-friendly update notifications
- ✅ Safe rollback if something goes wrong

### 2. Error Logging & Crash Reporting
- ✅ All errors logged to files
- ✅ Crash dumps saved locally
- ✅ Logs accessible via Help menu → "View Logs"
- ✅ Log files location:
  - **macOS**: `~/Library/Logs/countdown-electron/`
  - **Windows**: `%USERPROFILE%\AppData\Roaming\countdown-electron\logs\`
  - **Linux**: `~/.config/countdown-electron/logs/`

---

## 📦 Building Your App

### Option 1: Build for Your Current Platform (Simplest)

```bash
npm run dist
```

This creates a distributable installer in the `dist/` folder.

### Option 2: Build for Specific Platforms

```bash
# macOS only (creates .dmg and .zip)
npm run dist:mac

# Windows only (creates .exe installer)
npm run dist:win

# Linux only (creates .AppImage and .deb)
npm run dist:linux
```

### Build Output

After building, you'll find in the `dist/` folder:
- **macOS**: `Countdown Timer-0.1.0.dmg` and `Countdown Timer-0.1.0-mac.zip`
- **Windows**: `Countdown Timer Setup 0.1.0.exe`
- **Linux**: `Countdown Timer-0.1.0.AppImage` and `countdown-timer_0.1.0_amd64.deb`

---

## 🚀 Setting Up Auto-Updates

Auto-updates work through **GitHub Releases** (completely free). Here's how:

### Step 1: Build Your App

```bash
npm run dist
```

### Step 2: Create a GitHub Release

1. Go to your repository: https://github.com/tuneado/Countdown-Timer
2. Click "Releases" → "Create a new release"
3. Set tag version (e.g., `v0.1.0`) - **must match package.json version**
4. Set release title (e.g., "Version 0.1.0")
5. Upload the build files from `dist/` folder:
   - Upload the `.dmg` or `.zip` file for macOS
   - Upload the `.exe` for Windows
   - Upload `.AppImage` or `.deb` for Linux
   - **Important**: Also upload the `latest-mac.yml` or `latest.yml` files (auto-generated)
6. Click "Publish release"

### Step 3: Test Auto-Updates

1. Install the app from your first release
2. Bump version in `package.json` (e.g., `0.1.0` → `0.1.1`)
3. Build again: `npm run dist`
4. Create new release with new version tag (`v0.1.1`)
5. Upload new build files
6. Open the installed app → it should show "Update available" dialog!

---

## 🔐 Code Signing (Optional but Recommended)

### macOS Code Signing

**Why?** Without code signing, macOS users will see "App from unidentified developer" warnings.

**Requirements:**
- Apple Developer account ($99/year)
- Developer ID Application certificate

**Setup:**
```bash
# Set environment variables before building
export CSC_LINK=/path/to/DeveloperIDCertificate.p12
export CSC_KEY_PASSWORD=your-certificate-password
```

**Skip code signing for testing:**
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist:mac
```

### Windows Code Signing

**Why?** Without code signing, Windows SmartScreen will warn users.

**Requirements:**
- Code signing certificate from a trusted CA (e.g., DigiCert, Sectigo)

**Setup:**
```bash
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your-certificate-password
```

---

## 🎨 Adding App Icons

Currently using default Electron icon. To add custom icons:

1. Create a 1024x1024 PNG icon
2. Convert to required formats:
   - **macOS**: `icon.icns` → Use online converter or `iconutil`
   - **Windows**: `icon.ico` → Use online converter
   - **Linux**: `icon.png` → Use your PNG directly

3. Place in `build/` folder:
   ```
   build/
   ├── icon.icns   (macOS)
   ├── icon.ico    (Windows)
   └── icon.png    (Linux)
   ```

4. Rebuild: `npm run dist`

**Quick online converters:**
- PNG to ICNS: https://cloudconvert.com/png-to-icns
- PNG to ICO: https://convertio.co/png-ico/

---

## 🐛 Debugging & Troubleshooting

### View Logs

**From the app:**
- Help menu → "View Logs"

**Manually:**
```bash
# macOS
open ~/Library/Logs/countdown-electron/

# Windows
explorer %USERPROFILE%\AppData\Roaming\countdown-electron\logs\

# Linux
xdg-open ~/.config/countdown-electron/logs/
```

### Common Issues

**"Update check failed"**
- Make sure you have internet connection
- Check if GitHub repository is public
- Verify release version tags match `v0.1.0` format

**"Build failed - icon not found"**
- Either add icons to `build/` folder
- Or remove icon references from `package.json`

**"App won't open on macOS - 'damaged or can't be verified'"**
- This happens without code signing
- Users can bypass: System Preferences → Security & Privacy → "Open Anyway"
- Fix permanently: Get Apple Developer account and code sign

**Updates not detected**
- Version in `package.json` must be higher than current
- Release tag must match version (e.g., `v0.1.1` for version `0.1.1`)
- `latest-mac.yml` or `latest.yml` must be uploaded to release

---

## 📋 Version Bump Checklist

When releasing a new version:

1. ✅ Update version in `package.json`
2. ✅ Run `npm run build` (rebuild assets)
3. ✅ Run `npm run dist` (create installer)
4. ✅ Test the installer locally
5. ✅ Create GitHub release with matching tag (e.g., `v0.1.1`)
6. ✅ Upload build files from `dist/` folder
7. ✅ Upload `latest-mac.yml` or `latest.yml`
8. ✅ Publish release
9. ✅ Test auto-update from previous version

---

## 🎁 Publishing to GitHub (Automated)

For advanced users - automate release publishing:

```bash
# This builds AND publishes to GitHub automatically
# Requires GitHub token in environment: GITHUB_TOKEN=your_token
npm run publish
```

---

## 📝 Next Steps

1. **Add app icon** (see "Adding App Icons" above)
2. **Build your first release**: `npm run dist`
3. **Create GitHub release** with build files
4. **Share with users!**
5. **For updates**: Bump version → Build → Create new release

---

## 💡 Tips

- **Start with version 1.0.0** when ready for production
- **Use semantic versioning**: `major.minor.patch`
  - `1.0.0` → `1.0.1` for bug fixes
  - `1.0.0` → `1.1.0` for new features
  - `1.0.0` → `2.0.0` for breaking changes
- **Test updates** before releasing to all users
- **Keep release notes** - users appreciate knowing what's new!

---

## 🆘 Need Help?

- Check logs in Help → View Logs
- Check electron-builder docs: https://www.electron.build
- Check electron-updater docs: https://github.com/electron-userland/electron-updater

---

**Your app is now ready for distribution! 🎉**
