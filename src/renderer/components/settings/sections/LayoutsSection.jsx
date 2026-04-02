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
import { FileUpload } from '../../ui/FileUpload.jsx';
import { Button } from '../../ui/Button.jsx';

/**
 * LayoutsSection - Layout management settings
 */
export function LayoutsSection() {
  return (
    <div className="settings-section" id="section-layouts">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        Layouts
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Manage custom canvas layouts
      </p>

      <SettingsGroup title="Layout Creator">
        <SettingsItem
          block
          title="Visual Layout Editor"
          description="Create and customize layouts with a visual drag-and-drop editor"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              id="openLayoutCreatorBtn"
              variant="primary"
              icon="bi-easel"
            >
              Open Layout Creator
            </Button>
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Available Layouts">
        <SettingsItem
          block
          title="Built-in Layouts"
          description="Default layouts included with the application"
        >
          <div className="layout-list" id="builtinLayoutsList">
            {/* Built-in layouts populated by settings.js */}
          </div>
        </SettingsItem>

        <SettingsItem
          block
          title="Custom Layouts"
          description="User-uploaded custom layout files"
        >
          <div className="layout-list" id="customLayoutsList">
            <div className="p-4 rounded-lg bg-[var(--bg-surface-raised)] text-sm text-[var(--text-secondary)] flex items-center gap-2">
              <i className="bi bi-info-circle" />
              No custom layouts uploaded yet
            </div>
          </div>
          <div className="mt-3 hidden" id="customLayoutsActions">
            <Button
              id="clearAllCustomLayouts"
              variant="danger"
              icon="bi-trash"
            >
              Clear All Custom Layouts
            </Button>
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Upload Custom Layout">
        <SettingsItem
          block
          title="Import Layout"
          description="Upload a custom layout JSON file"
        >
          <div className="space-y-3">
            <FileUpload
              id="layoutFileInput"
              accept=".json"
              buttonText="Choose layout file..."
              icon="bi-upload"
            />
            
            <div id="layoutFileName" className="text-sm text-[var(--text-secondary)] hidden">
              <i className="bi bi-file-earmark-code mr-2" />
              <span>No file selected</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                id="uploadLayoutBtn"
                variant="primary"
                icon="bi-plus-circle"
                disabled
              >
                Add Layout
              </Button>
              <Button
                id="validateLayoutBtn"
                variant="ghost"
                icon="bi-check-circle"
                disabled
              >
                Validate
              </Button>
              <Button
                id="downloadSampleBtn"
                variant="ghost"
                icon="bi-download"
              >
                Download Sample
              </Button>
            </div>
          </div>
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

export default LayoutsSection;
