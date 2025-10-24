# Logger Configuration Guide

The Countdown Timer application uses a centralized logging system that automatically adjusts based on the environment.

## Environment Detection

### Development Mode
- Runs when you use `npm start`
- **Log Level**: `DEBUG` (shows all logs)
- **History Size**: 200 logs
- Shows detailed information for debugging

### Production Mode
- Runs when the app is packaged
- **Log Level**: `WARN` (shows only warnings and errors)
- **History Size**: 50 logs
- Minimal logging for performance

## Log Levels

From most to least verbose:

1. **DEBUG** - Detailed debugging information
2. **INFO** - General informational messages
3. **WARN** - Warning messages
4. **ERROR** - Error messages only
5. **NONE** - Disable all logging

## How to Change Log Levels

### Option 1: Edit logger.config.js (Development Only)

Edit the `logger.config.js` file in the root directory:

```javascript
module.exports = {
  development: {
    level: 'DEBUG',      // Change to 'INFO', 'WARN', 'ERROR', or 'NONE'
    enabled: true,
    maxHistorySize: 200
  },
  
  production: {
    level: 'WARN',       // Production log level
    enabled: true,
    maxHistorySize: 50
  },
  
  // Override both environments
  override: null         // Set to 'DEBUG', 'INFO', etc. to override
};
```

### Option 2: Change at Runtime via Console

Open Developer Tools (Ctrl+Shift+I / Cmd+Option+I) and use:

```javascript
// Change log level
logger.setLevel('ERROR');  // Only show errors
logger.setLevel('DEBUG');  // Show everything
logger.setLevel('NONE');   // Disable logging

// Disable/enable logging
logger.setEnabled(false);  // Turn off
logger.setEnabled(true);   // Turn on

// View log history
logger.getHistory();       // Get all logs
logger.getHistory(10);     // Get last 10 logs

// Export logs
logger.exportLogs();       // Get logs as formatted text

// Clear history
logger.clearHistory();
```

## NPM Scripts

```bash
# Development mode (DEBUG logs)
npm start

# Test production mode locally (WARN logs)
npm run start:prod

# Build for production (will use WARN logs when packaged)
npm run build
```

## Log Categories

Logs are organized by category with emojis:

- ⏱️ `TIMER` - Timer operations
- 📹 `VIDEO` - Video input management
- 🔊 `AUDIO` - Sound/audio operations
- ⚙️ `SETTINGS` - Settings changes
- 🎨 `CANVAS` - Canvas rendering
- 📐 `LAYOUT` - Layout changes
- 💾 `PRESET` - Preset operations
- 📷 `FEATURE` - Feature image
- 🔄 `IPC` - Inter-process communication
- ⚡ `SYSTEM` - System operations

## Examples

### In Code

```javascript
import logger from './utils/logger.js';

// Info log
logger.info('TIMER', 'Timer started', { duration: 300 });

// Warning
logger.warn('VIDEO', 'No camera device found');

// Error with error object
logger.error('AUDIO', 'Failed to play sound', error);

// Debug (only shown in development)
logger.debug('CANVAS', 'Frame rendered', frameData);
```

### Viewing Logs

1. Open Developer Tools
2. Look for formatted logs with timestamps and emojis:
   ```
   [14:23:45] 📹 Video input started
   [14:23:46] ⚙️ Settings updated
   [14:23:50] ⏱️ Timer completed
   ```

## Troubleshooting

**"I'm not seeing any logs"**
- Check the log level: `logger.currentLevel`
- Make sure logging is enabled: `logger.enabled`
- Try setting: `logger.setLevel('DEBUG')`

**"Too many logs in production"**
- Production automatically uses WARN level
- Check that `app.isPackaged` is true
- Verify `process.env.NODE_ENV` is 'production'

**"I want to save logs to a file"**
- Use: `console.log(logger.exportLogs())`
- Copy the output from the console
- Or implement a file save function using Electron's fs module
