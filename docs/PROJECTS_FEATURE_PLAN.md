# Projects Feature Plan

## Overview
Add a complete projects management system that allows users to save, load, manage, and export entire app configurations including timers, layouts, images, colors, and all settings. Projects are managed entirely through the top menubar.

---

## 1. Feature Requirements

### Core Functionality
- **Create Project** — Save current app state as a named project
- **Load Project** — Restore a previously saved project
- **Rename Project** — Update project name
- **Delete Project** — Remove unwanted projects
- **Export Project** — Save project to external file (.rctimer format)
- **Import Project** — Load project from external file
- **Duplicate Project** — Create a copy of existing project
- **Set Default Project** — Auto-load on app startup

### Project Contents
A project should capture:
- **Timer Configuration**
  - Default time (hours/minutes/seconds)
  - Last set time
  - Presets (all 10 preset slots with names and times)
  
- **Layout Settings**
  - Current layout selection
  - Layout-specific configurations
  
- **Visual Customization**
  - Theme (dark/light)
  - Color scheme (all custom colors)
  - Font selections
  - Canvas background color
  
- **Media Assets**
  - Cover image (path or embedded base64)
  - Feature image (path or embedded base64)
  - Message card content
  
- **Display Settings**
  - Clock visibility and format
  - Warning thresholds (warning %, critical %)
  - Display window position/size (optional)
  
- **API Settings**
  - REST API enabled/port
  - WebSocket enabled/port
  - OSC enabled/ports
  - API metadata settings
  
- **Audio Settings**
  - Sound notifications enabled/disabled
  - Completion sound selection
  
- **Metadata**
  - Project name
  - Created date
  - Last modified date
  - Last used date
  - Times used count
  - Description (optional)
  - Tags (optional)

---

## 2. Architecture Design

### Data Structure

```typescript
interface Project {
  id: string                    // UUID
  name: string                  // User-defined name
  description?: string          // Optional description
  tags?: string[]              // Optional tags for organization
  createdAt: string            // ISO 8601 timestamp
  modifiedAt: string           // ISO 8601 timestamp
  lastUsedAt: string           // ISO 8601 timestamp
  usageCount: number           // Times this project was loaded
  isDefault: boolean           // Auto-load on startup
  
  // Complete app configuration
  config: {
    timer: {
      defaultTime: { hours: number, minutes: number, seconds: number }
      lastSetTime: number        // milliseconds
      presets: Array<{
        name: string
        time: number             // seconds
      }>
    }
    
    layout: {
      current: string            // 'classic' | 'minimal' | etc.
      preferences: Record<string, any>  // Layout-specific settings
    }
    
    theme: {
      mode: 'dark' | 'light'
      colors: {
        progressSuccess: string
        progressWarning: string
        progressDanger: string
        progressOvertime: string
        canvasBackground: string
        // ... other custom colors
      }
      fonts: {
        primary: string
        secondary: string
      }
    }
    
    media: {
      coverImage: {
        type: 'path' | 'embedded' | 'none'
        data: string             // File path or base64
      }
      featureImage: {
        type: 'path' | 'embedded' | 'none'
        data: string
      }
      message: {
        visible: boolean
        title: string
        content: string
      }
    }
    
    display: {
      clock: {
        visible: boolean
        format: '12h' | '24h'
      }
      warnings: {
        warningThreshold: number   // percentage
        criticalThreshold: number  // percentage
      }
      window: {
        rememberPosition: boolean
        x?: number
        y?: number
        width?: number
        height?: number
      }
    }
    
    api: {
      rest: {
        enabled: boolean
        port: number
      }
      websocket: {
        enabled: boolean
        port: number
      }
      osc: {
        enabled: boolean
        receivePort: number
        sendPort: number
        metadata: boolean
      }
    }
    
    audio: {
      enabled: boolean
      completionSound: string
    }
  }
  
  // Project format version (for future migrations)
  version: string  // e.g., "1.0.0"
}

interface SessionManifest {
  currentSessionId: string | null
  defaultSessionId: string | null
  projects: Session[]
}
```

### Storage Strategy

**Storage Location:**
```
User Data Directory/
  countdown-timer/
    projects/
      manifest.json              // Project list and metadata
      projects/
        {session-id}.json        // Individual project files
        {session-id}-assets/     // Session-specific media
          cover-image.jpg
          feature-image.png
      backups/                   // Auto-backups before modifications
        {timestamp}-manifest.json
```

**File Format:**
- **Internal Storage:** JSON files for easy editing/debugging
- **Export Format:** `.rctimer` (JSON with optional embedded assets)
- **Compression:** Optional gzip for exports to reduce file size

**Backup Strategy:**
- Auto-backup before project deletion
- Auto-backup before project overwrite (when saving over existing)
- Keep last 5 backups per session
- Manual backup option

---

## 3. User Interface Design

### Menu Integration

**New "Projects" Menu (in menubar):**
```
Projects
  ├─ Current: [Project Name] ✓
  ├─ ───────────────────
  ├─ New Session...            ⌘N
  ├─ Open Session...           ⌘O
  ├─ ───────────────────
  ├─ Save Project              ⌘S
  ├─ Save As...                ⌘⇧S
  ├─ Duplicate Session...
  ├─ ───────────────────
  ├─ Rename Session...
  ├─ Delete Session...
  ├─ ───────────────────
  ├─ Manage Projects...        ⌘M (Opens dedicated window)
  ├─ ───────────────────
  ├─ Import Session...         ⌘I
  ├─ Export Session...         ⌘E
  ├─ ───────────────────
  ├─ Set as Default
  ├─ Clear Default
  ├─ ───────────────────
  ├─ Recent Projects           →
  │   ├─ Project A
  │   ├─ Project B
  │   └─ Project C
```

### Projects Manager Window

**New Dedicated Window** (similar to Settings window):

```
┌─────────────────────────────────────────────────────────┐
│ Projects Manager                    (8/10)         ⊗ ⊕ ⊗│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐│
│  │  Projects List   │  │   Project Details            ││
│  ├──────────────────┤  ├──────────────────────────────┤│
│  │                  │  │                              ││
│  │ ⭐ Default       │  │  Name: Production Timer      ││
│  │ 📁 Project A ✓   │  │  Created: 2026-04-01        ││
│  │ 📁 Project B     │  │  Modified: 2026-04-02       ││
│  │ 📁 Client Demo   │  │  Last used: Today, 10:15 AM ││
│  │ 📁 Presentation  │  │  Times used: 24             ││
│  │ 📁 Workshop      │  │                              ││
│  │                  │  │  Description:                ││
│  │                  │  │  ┌──────────────────────┐   ││
│  │                  │  │  │ Timer setup for      │   ││
│  │                  │  │  │ live production      │   ││
│  │                  │  │  └──────────────────────┘   ││
│  │                  │  │                              ││
│  │                  │  │  Tags: [production] [live]  ││
│  │                  │  │                              ││
│  │                  │  │  Contains:                   ││
│  │                  │  │  ✓ 8 custom presets          ││
│  │                  │  │  ✓ Custom color scheme       ││
│  │                  │  │  ✓ Cover image               ││
│  │                  │  │  ✓ Feature image             ││
│  │                  │  │  ✓ API configuration         ││
│  │                  │  │                              ││
│  │  [New] [Import]  │  │  [Load] [Duplicate]         ││
│  │                  │  │  [Export] [Delete]           ││
│  └──────────────────┘  └──────────────────────────────┘│
│                                                          │
│  ⓘ Project limit: 8 of 10 used          [Close]        │
└─────────────────────────────────────────────────────────┘
```

**Quick Project Selector** (OPTIONAL - in main window toolbar):
> **Note:** Projects are primarily managed via the top menubar. A quick project selector in the main window is optional and may be added in a future phase for convenience.

```
┌─────────────────────────────────────────┐
│ Current Session: [Project A ▾]          │
└─────────────────────────────────────────┘
```

### Dialogs

**New Project Dialog:**
- Name input (required)
- Description textarea (optional)
- Tags input (optional)
- "Set as default" checkbox
- Option: "Save current state" vs "Start fresh"

**Import Project Dialog:**
- File picker (.rctimer files)
- Preview project details before import
- Conflict resolution: "Keep both" / "Replace existing"

**Export Project Dialog:**
- Filename input
- Embed media toggle (increases file size but makes portable)
- Compress toggle (gzip)
- Location picker

**Delete Confirmation:**
- "Are you sure you want to delete [Project Name]?"
- "Create backup before deletion" checkbox (checked by default)
- Permanent warning

---

## 4. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
**Goal:** Set up data structures and storage system

**Tasks:**
1. Create project data model (TypeScript interfaces)
2. Implement SessionManager class in main process
   - Create session
   - Load session
   - Save session
   - Delete session
   - List projects
3. Create projects storage directory structure
4. Implement manifest.json read/write
5. Add project file I/O with error handling
6. Create backup system

**Files to Create:**
- `src/main/sessionManager.js` — Core project management
- `src/main/models/Session.js` — Project data model
- `src/main/utils/sessionStorage.js` — File I/O utilities

**Files to Modify:**
- `src/main/main.js` — Initialize SessionManager
- `src/main/settingsManager.js` — Integrate with projects

### Phase 2: State Capture & Restore (Week 1-2)
**Goal:** Implement capturing and restoring complete app state

**Tasks:**
1. Create state snapshot function (captures all settings)
2. Implement state restore function
3. Handle media assets (copy to project folder)
4. Test state consistency across save/load cycles
5. Add migration system for version changes

**Files to Create:**
- `src/main/sessionState.js` — State capture/restore logic

**Files to Modify:**
- `src/main/settingsManager.js` — Export/import session-compatible format
- `src/renderer/js/countdown.js` — Expose complete state for capture

### Phase 3: Basic UI (Week 2)
**Goal:** Add essential menubar UI for project management

> **Note:** All project management is done via the top menubar. No UI elements will be added to the main window.

**Tasks:**
1. Add "Projects" menu to menubar with all actions
2. Create IPC handlers for all project operations
3. Create basic project dialogs (New, Rename, Delete)
4. Implement project switch notification
5. Add project indicator in status bar (shows current project name)

**Files to Create:**
- `src/renderer/components/dialogs/ProjectDialog.jsx` — New/Edit/Rename dialogs

**Files to Modify:**
- `src/main/menu.js` — Add Projects menu with all operations
- `src/main/ipcHandlers.js` — Add project IPC handlers
- `src/renderer/js/countdown.js` — Add project switching logic
- `src/renderer/components/StatusFooter.jsx` — Add current project indicator

### Phase 4: Projects Manager Window (Week 2-3)
**Goal:** Build dedicated management interface

**Tasks:**
1. Create Projects Manager window
2. Build projects list with search/filter
3. Implement project details panel
4. Add duplicate project feature
5. Add project preview (thumbnail generation)
6. Implement default project management

**Files to Create:**
- `src/renderer/projects.html` — Projects manager HTML
- `src/renderer/projects.jsx` — Projects manager UI
- `src/renderer/components/projects/ProjectsList.jsx`
- `src/renderer/components/projects/SessionDetails.jsx`
- `src/renderer/components/projects/SessionCard.jsx`

**Files to Modify:**
- `src/main/windows.js` — Add projects window management

### Phase 5: Import/Export (Week 3)
**Goal:** Enable external project file sharing

**Tasks:**
1. Define .rctimer file format specification
2. Implement project export with options:
   - Embed media vs reference paths
   - Compression
   - Metadata inclusion
3. Implement project import with validation
4. Add conflict resolution for duplicate names
5. Create export presets (minimal, full, portable)

**Files to Create:**
- `src/main/sessionIO.js` — Import/export logic
- `src/main/utils/sessionValidator.js` — Validate imported projects

**Files to Modify:**
- `src/main/sessionManager.js` — Add import/export methods

### Phase 6: Polish & Testing (Week 3-4)
**Goal:** Refinement, testing, and documentation

**Tasks:**
1. Add keyboard shortcuts (⌘N, ⌘O, ⌘S, etc.)
2. Implement undo/redo for project operations
3. Add project auto-save option
4. Create project templates (preset configurations)
5. Add project sharing via URL (optional)
6. Comprehensive testing
7. User documentation
8. Migration guide for existing users

**Testing Checklist:**
- [ ] Create project with all content types
- [ ] Load project restores exact state
- [ ] Rename project updates manifest
- [ ] Delete project removes files and backup
- [ ] Export creates valid .rctimer file
- [ ] Import validates and loads correctly
- [ ] Default project loads on app start
- [ ] Project switching preserves unsaved changes warning
- [ ] Media assets copy correctly
- [ ] Backup system works reliably
- [ ] Handle corrupted project files gracefully
- [ ] Large project files (>50MB) handle well
- [ ] Concurrent project operations don't conflict

---

## 5. Technical Considerations

### Data Migration Strategy
```javascript
// Project version management
const MIGRATIONS = {
  '1.0.0': (session) => session, // No changes
  '1.1.0': (session) => {
    // Add new fields with defaults
    return {
      ...session,
      config: {
        ...session.config,
        newFeature: defaultValue
      }
    }
  }
}

function migrateSession(session) {
  let current = session
  const versions = Object.keys(MIGRATIONS).sort()
  
  for (const version of versions) {
    if (semver.gt(version, current.version)) {
      current = MIGRATIONS[version](current)
      current.version = version
    }
  }
  
  return current
}
```

### Media Asset Handling
**Options:**
1. **Path References** (default)
   - Pros: Small file size, no duplication
   - Cons: Breaks if original file moved/deleted
   
2. **Copy to Project Folder**
   - Pros: Self-contained, reliable
   - Cons: Duplicates files, larger storage
   
3. **Embedded Base64** (export option)
   - Pros: Single portable file
   - Cons: Very large file size, slower loading

**Recommendation:** Use approach #2 (copy) for internal storage, offer #3 as export option.

### Performance Optimization
- Lazy load project list (virtualized for 100+ projects)
- Debounce auto-save (5 second delay)
- Background project validation
- Async file operations with loading states
- Cache frequently accessed projects

### Security Considerations
- Validate all imported JSON (schema validation)
- Sanitize file paths to prevent directory traversal
- Limit project file size (default 100MB max)
- Maximum 10 projects enforced (UI prevents creating more)
- Scan for malicious content in imported files (optional)
- No eval() or arbitrary code execution
- No password protection (projects stored locally with OS-level security)

### Error Handling
```javascript
// Graceful degradation
try {
  await loadSession(sessionId)
} catch (error) {
  logger.error('Project load failed:', error)
  
  // Attempt recovery
  if (error.code === 'CORRUPTED') {
    await restoreFromBackup(sessionId)
  } else if (error.code === 'MISSING_ASSETS') {
    await loadSessionWithMissingAssets(sessionId)
  } else {
    // Fall back to default session
    await loadDefaultSession()
  }
  
  // Notify user
  notifyUser('Project load failed, using default', 'warning')
}
```

---

## 6. User Experience Flow

### Creating First Session
1. User opens app (first time, no projects exist)
2. App creates "Default" project automatically
3. User makes customizations
4. User clicks "Projects → Save As..." → names it "My Project"
5. Project saved, set as current

### Switching Projects
1. User clicks project dropdown in toolbar
2. Selects "Production Timer"
3. Confirmation dialog: "Save changes to current session?"
   - Yes: Save and switch
   - No: Discard and switch
   - Cancel: Stay on current
4. App loads new session, updates UI

### Exporting Session
1. User clicks "Projects → Export Session..."
2. Dialog shows export options:
   - [x] Embed media files (portable)
   - [x] Compress file
   - [ ] Include API settings
3. User selects location, clicks Export
4. Success notification with file path

### Importing Session
1. User clicks "Projects → Import Session..."
2. Selects .rctimer file
3. Preview shows:
   - Project name, description
   - Created date
   - Contains: 8 presets, custom colors, 2 images
4. User clicks Import
5. Project added to list, ready to load

### Closing App with Unsaved Changes
1. User makes changes to current project (timer settings, colors, etc.)
2. User attempts to quit app (⌘Q or File → Quit)
3. Dialog appears: "Save changes to 'Project A' before closing?"
   - Save: Save project and quit
   - Don't Save: Discard changes and quit
   - Cancel: Return to app
4. If Save: project updated, app closes
5. If Don't Save: changes lost, app closes with last saved state

### Manual Save Workflow
1. User makes changes to session
2. Status indicator shows "• Unsaved changes"
3. User presses ⌘S or clicks "Projects → Save Session"
4. Project file updated immediately
5. Status indicator clears

---

## 7. Configuration & Settings

### App Settings (New Section)
```
Projects
  [ ] Auto-save on changes (Manual save recommended)
  [x] Prompt to save unsaved changes on exit
  [x] Load default project on startup
  [x] Create backups before deletion
  [ ] Sync projects via cloud (future)
  
  Project Limits
    Maximum projects: 10 (limit reached: manage projects to create new)
  
  Backup Settings
    Keep last [5] backups per session
    Auto-delete backups older than [30] days
    
  Storage
    Projects folder: [~/Library/.../projects] [Change...]
    Current usage: 45.2 MB (8/10 projects)
    [Clean up backups]
```

---

## 8. Future Enhancements (Post-MVP)

- **Cloud Sync** — Sync projects across devices (Dropbox/iCloud integration)
- **Project Templates** — Preconfigured projects for common use cases
- **Project Sharing** — Generate share link, import from URL
- **Version History** — Track changes over time, restore previous versions
- **Project Groups** — Organize projects into folders/projects
- **Quick Switch** — Global keyboard shortcut to switch projects
- **Project Search** — Full-text search across project contents
- **Auto-categorization** — AI-suggested tags based on content
- **Collaborative Projects** — Multi-user editing (far future)

---

## 9. Success Metrics

- Users create average of 3+ projects within first week
- Project switch time < 2 seconds for projects with media
- Zero data loss in project save/load cycles
- Export/import success rate > 99%
- User satisfaction rating > 4.5/5 for feature

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Project file corruption | High | Backup system, validation, recovery |
| Large file performance | Medium | Lazy loading, compression, size limits |
| Complex UI overwhelming users | Medium | Progressive disclosure, tooltips, tutorials |
| Storage space concerns | Low | Compression, cleanup tools, warnings |
| Breaking changes in updates | Medium | Version migration system, backward compatibility |

---

## Implementation Priority

**Must Have (MVP):**
- ✅ Create, load, save projects (manual save with ⌘S)
- ✅ Unsaved changes prompt on app close
- ✅ Rename, delete projects
- ✅ Project limit enforcement (max 10 projects)
- ✅ Basic project list UI with usage stats
- ✅ Export/import .rctimer files
- ✅ Auto-backup before destructive operations

**Should Have (v1.1):**
- Project Manager window
- Project preview/thumbnails
- Default project setting
- Project search/filter (important with 10 project limit)

**Nice to Have (v1.2+):**
- Project templates
- Cloud sync
- Version history
- Collaborative features

---

## File Format Specification

### .rctimer Format (v1.0.0)

```json
{
  "fileType": "RocketTimer Session",
  "version": "1.0.0",
  "exportedAt": "2026-04-02T10:30:00Z",
  "exportedBy": "Rocket Countdown Timer v2.0.0",
  
  "session": {
    "id": "uuid-here",
    "name": "Production Timer",
    "description": "Main production countdown",
    "tags": ["production", "live"],
    "createdAt": "2026-04-01T08:00:00Z",
    "modifiedAt": "2026-04-02T10:29:45Z",
    
    "config": {
      // Full project config as defined above
    },
    
    "assets": {
      "coverImage": {
        "filename": "cover.jpg",
        "mimeType": "image/jpeg",
        "size": 125000,
        "data": "base64-encoded-data-here" // if embedded
      },
      "featureImage": {
        "filename": "feature.png",
        "mimeType": "image/png",
        "size": 85000,
        "data": "base64-encoded-data-here"
      }
    }
  },
  
  "checksum": "sha256-hash-here" // Verify integrity
}
```

---

## Documentation

### User Guide Sections to Add
1. **Getting Started with Projects**
2. **Creating Your First Session**
3. **Organizing Multiple Projects**
4. **Sharing Projects with Team Members**
5. **Backing Up and Restoring Projects**
6. **Troubleshooting Project Issues**

### API Documentation Updates
- Add project management endpoints (if exposing via API)
- Document .rctimer file format for developers

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Core Infrastructure | 3-4 days | None |
| Phase 2: State Capture | 3-4 days | Phase 1 |
| Phase 3: Basic UI | 2-3 days | Phase 2 |
| Phase 4: Manager Window | 4-5 days | Phase 3 |
| Phase 5: Import/Export | 2-3 days | Phase 1, 2 |
| Phase 6: Polish & Testing | 4-5 days | All |
| **Total** | **18-24 days** | ~3-4 weeks |

---

## Next Steps

1. **Review & Approve Plan** — Discuss any changes to scope/approach
2. **Set Up Development Branch** — `feature/projects-management`
3. **Begin Phase 1** — Core infrastructure implementation
4. **Iterative Development** — Build, test, refine each phase
5. **Beta Testing** — Internal testing with real workflows
6. **Documentation** — User guide and API docs
7. **Release** — v2.1.0 with projects feature

---

## Decisions Made

1. ✅ **Save Strategy:** Manual save only (⌘S) with prompt on app close if unsaved changes detected
2. ✅ **Project Limit:** Maximum 10 projects (UI enforced, prevents creation beyond limit)
3. ✅ **Password Protection:** Not required (rely on OS-level security)
4. ✅ **Analytics:** Simple usage tracking (last used date, times used count) displayed in project list
5. ✅ **Export:** Standard single-project export only (.rctimer format)
6. ❌ **Online Templates:** Not in scope for v1.0

---

**Document Version:** 1.1  
**Last Updated:** 2026-04-02  
**Author:** Development Team  
**Status:** Approved - Ready for Implementation
