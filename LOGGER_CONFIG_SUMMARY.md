# Logger Environment Configuration - Summary

## ✅ What Was Implemented

### 1. **Automatic Environment Detection**
The logger now automatically detects whether you're in development or production:

- **Development** (npm start): Shows DEBUG level logs (all logs)
- **Production** (packaged app): Shows WARN level logs (only warnings and errors)

### 2. **Environment Configuration**

**Development Mode:**
```javascript
// Shows: DEBUG, INFO, WARN, ERROR
// Stores: 200 log entries
// Perfect for debugging
```

**Production Mode:**
```javascript
// Shows: WARN, ERROR only
// Stores: 50 log entries
// Better performance, less noise
```

### 3. **NPM Scripts Updated**

```bash
npm start           # Development mode (DEBUG logs)
npm run start:prod  # Test production mode (WARN logs)
```

### 4. **Configuration File**

Created `logger.config.js` in the root directory where you can override settings:

```javascript
module.exports = {
  development: {
    level: 'DEBUG',
    enabled: true,
    maxHistorySize: 200
  },
  production: {
    level: 'WARN',
    enabled: true,
    maxHistorySize: 50
  },
  override: null  // Set to 'INFO' or 'ERROR' to override
};
```

## 🚀 Quick Start

### During Development
Just run normally:
```bash
npm start
```
You'll see all logs (DEBUG level)

### To Test Production Logging
```bash
npm run start:prod
```
You'll only see warnings and errors (WARN level)

### To Change Log Level Temporarily
Open DevTools console and run:
```javascript
logger.setLevel('ERROR');  // Only errors
logger.setLevel('INFO');   // Info and above
logger.setLevel('DEBUG');  // Everything
```

### To Check Current Settings
```javascript
logger.isDevelopment  // true or false
logger.getLevelName() // 'DEBUG', 'INFO', 'WARN', etc.
logger.enabled        // true or false
```

## 📝 Files Modified

1. **src/renderer/js/utils/logger.js**
   - Added environment detection
   - Auto-adjusts log level based on environment
   - Loads optional config file

2. **src/main/main.js**
   - Sets NODE_ENV based on app.isPackaged
   - Logs environment on startup

3. **package.json**
   - Updated start script to set NODE_ENV=development
   - Added start:prod script for testing production mode

4. **logger.config.js** (NEW)
   - Configuration file for log levels
   - Can override defaults

5. **LOGGER_GUIDE.md** (NEW)
   - Complete documentation
   - Examples and troubleshooting

## 🎯 Best Practices

### What to Log at Each Level

**DEBUG:** Detailed flow information
```javascript
logger.debug('CANVAS', 'Drawing frame', { x, y, width, height });
```

**INFO:** Important events
```javascript
logger.info('VIDEO', 'Video input started', { device: deviceId });
```

**WARN:** Recoverable issues
```javascript
logger.warn('TIMER', 'Timer stopped before completion');
```

**ERROR:** Critical failures
```javascript
logger.error('AUDIO', 'Failed to play sound', error);
```

## 🔍 How It Works

1. **On app startup:**
   - main.js sets NODE_ENV based on app.isPackaged
   - Logger detects environment
   - Sets appropriate log level (DEBUG for dev, WARN for prod)

2. **In development:**
   - All logs are shown
   - More history is stored (200 entries)
   - Helps with debugging

3. **In production:**
   - Only warnings and errors are shown
   - Less history stored (50 entries)
   - Better performance
   - Cleaner output for users

## 🛠️ When You Package the App

When you build/package your app (using electron-builder or similar):

```bash
npm run build
```

The packaged app will automatically:
- Detect it's packaged (app.isPackaged = true)
- Set NODE_ENV = 'production'
- Use WARN log level
- Only show important messages

No configuration needed! ✨
