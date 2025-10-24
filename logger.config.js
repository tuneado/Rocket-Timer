/**
 * Logger Configuration
 * You can manually override log levels here during development
 * 
 * Available levels:
 * - DEBUG: Show everything (most verbose)
 * - INFO: Show informational messages and above
 * - WARN: Show warnings and errors only
 * - ERROR: Show only errors
 * - NONE: Disable all logging
 */

module.exports = {
  // Environment-specific settings
  development: {
    level: 'DEBUG',        // Show all logs in development
    enabled: true,
    maxHistorySize: 200    // Store more logs for debugging
  },
  
  production: {
    level: 'WARN',         // Only show warnings and errors in production
    enabled: true,
    maxHistorySize: 50     // Store fewer logs in production
  },
  
  // Manual override (leave null to use environment defaults)
  override: 'DEBUG'           // Set to 'DEBUG', 'INFO', 'WARN', 'ERROR', or 'NONE' to override
};
