/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Input } from '../../ui/Input.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { Button } from '../../ui/Button.jsx';

/**
 * ApiSection - API & Integration settings
 */
export function ApiSection() {
  return (
    <div className="settings-section" id="section-api">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        API & Integration
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configure unified API system with REST, WebSocket, and OSC protocols
      </p>

      <SettingsGroup title="Unified API Server">
        <SettingsItem
          title="Enable Unified API Server"
          description="Multi-protocol API server with REST HTTP, WebSocket, and OSC support for external control"
        >
          <Switch id="companionServerEnabled" />
        </SettingsItem>

        <SettingsItem
          title="Server Port"
          description="Port number for API server (requires restart)"
        >
          <Input 
            type="number" 
            id="companionServerPort" 
            min="1024" 
            max="65535" 
            defaultValue="9999"
            className="w-24"
          />
        </SettingsItem>

        <SettingsItem
          block
          title="Server Status"
          description="Current status and endpoint information"
        >
          <div className="server-status-container space-y-3">
            <div className="flex items-center gap-2">
              <span id="apiStatusDot" className="w-2.5 h-2.5 rounded-full bg-[var(--text-muted)]" />
              <span id="apiStatusText" className="text-sm text-[var(--text-secondary)]">Checking...</span>
            </div>
            
            <div id="apiEndpoints" className="hidden space-y-2">
              <div className="endpoint-item flex items-center gap-2 text-sm">
                <strong className="text-[var(--text-primary)]">REST API:</strong>
                <code id="apiHttpEndpoint" className="px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs">
                  http://localhost:9999/api
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="copy-btn p-1" 
                  data-copy-target="apiHttpEndpoint"
                  icon="bi-clipboard"
                />
              </div>
              <div className="endpoint-item flex items-center gap-2 text-sm">
                <strong className="text-[var(--text-primary)]">WebSocket:</strong>
                <code id="apiWsEndpoint" className="px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs">
                  ws://localhost:8080
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="copy-btn p-1" 
                  data-copy-target="apiWsEndpoint"
                  icon="bi-clipboard"
                />
              </div>
              <div className="endpoint-item flex items-center gap-2 text-sm">
                <strong className="text-[var(--text-primary)]">OSC Control:</strong>
                <code id="apiOscEndpoint" className="px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs">
                  osc://localhost:7000
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="copy-btn p-1" 
                  data-copy-target="apiOscEndpoint"
                  icon="bi-clipboard"
                />
              </div>
            </div>
            
            <Button
              id="testApiConnection"
              variant="ghost"
              size="sm"
              icon="bi-arrow-repeat"
            >
              Test Connection
            </Button>
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="API Documentation">
        <SettingsItem
          block
          title="Available Endpoints"
          description="REST API endpoints for timer control"
        >
          <div className="api-docs space-y-2">
            <ApiEndpoint method="GET" path="/api/timer/state" desc="Get timer state with warning levels & colors" />
            <ApiEndpoint method="POST" path="/api/timer/start" desc="Start the timer" />
            <ApiEndpoint method="POST" path="/api/timer/stop" desc="Stop/pause the timer" />
            <ApiEndpoint method="POST" path="/api/timer/reset" desc="Reset timer to last set time" />
            <ApiEndpoint method="POST" path="/api/timer/set-time" desc="Set time (hours, minutes, seconds or total seconds)" />
            <ApiEndpoint method="POST" path="/api/timer/adjust" desc="Adjust time by ±seconds" />
            <ApiEndpoint method="POST" path="/api/message/show" desc="Display custom message" />
            <ApiEndpoint method="POST" path="/api/layout/change" desc="Change timer layout" />
          </div>
          
          <Button
            id="openApiDocs"
            variant="ghost"
            icon="bi-book"
            className="mt-4"
          >
            View Full Documentation
          </Button>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Security">
        <SettingsItem
          title="Allow External Access"
          description="Allow connections from other devices on the network (not just localhost)"
        >
          <Switch id="companionAllowExternal" />
        </SettingsItem>

        <SettingsItem
          block
          title="Network Access"
          description="Local IP addresses for external access"
        >
          <div id="networkAddresses" className="network-addresses">
            <div className="p-4 rounded-lg bg-[var(--bg-surface-raised)] text-sm text-[var(--text-secondary)] flex items-center gap-2">
              <i className="bi bi-info-circle" />
              Enable external access to see available network addresses
            </div>
          </div>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

/**
 * ApiEndpoint - Helper component for API endpoint display
 */
function ApiEndpoint({ method, path, desc }) {
  const methodColors = {
    GET: 'bg-[var(--color-success)] text-white',
    POST: 'bg-[var(--color-primary)] text-white',
    PUT: 'bg-[var(--color-warning)] text-black',
    DELETE: 'bg-[var(--color-danger)] text-white',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${methodColors[method] || ''}`}>
        {method}
      </span>
      <code className="px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs">
        {path}
      </code>
      <span className="text-[var(--text-muted)] text-xs">{desc}</span>
    </div>
  );
}

export default ApiSection;
