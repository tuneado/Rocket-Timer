# Future Implementation Ideas

A collection of architectural improvements and features to consider for future development.

---

## Single-Renderer Architecture (Canvas Streaming)

**Priority:** High  
**Impact:** Performance, consistency, extensibility  
**Status:** Planned

### Problem

The app currently creates **separate `UnifiedCanvasRenderer` instances** for each output:
- Main window preview canvas
- External display window (via `displayCanvas.js`)

Each instance runs its own `requestAnimationFrame` loop, performs independent text measurement, compositing, gradient calculations, and font resolution. This means:
- **Duplicated CPU/GPU work** — every frame is rendered twice
- **Visual inconsistencies** — each renderer resolves fonts and styles independently (e.g., font fallback differences across windows on Windows)
- **Poor scalability** — adding NDI, recording, or streaming outputs would require additional renderer instances

### Proposed Solution

Replace the multi-renderer model with a **single renderer, multi-output** architecture:

```
┌─────────────────────┐
│  UnifiedCanvasRenderer  │  ← Single instance, one render loop
│  (Offscreen Canvas)     │
└──────────┬──────────┘
           │ Frame ready
           ├──────────────────► Preview Canvas (main window)
           │                    Direct drawImage() copy
           │
           ├──────────────────► Display Window (IPC)
           │                    canvas.toBlob() or ImageBitmap transfer
           │                    Display window just draws received image
           │
           ├──────────────────► NDI Output (future)
           │                    canvas.getImageData() → raw BGRA buffer
           │                    Send to native NDI SDK module
           │
           └──────────────────► Web Stream / Recording (future)
                                MediaRecorder or WebSocket frame delivery
```

### Key Design Points

1. **Main process renders once** — the `UnifiedCanvasRenderer` draws to an offscreen canvas
2. **Preview canvas** — direct `drawImage()` copy (already how `addOutput()` works)
3. **Display window becomes a dumb viewer** — receives compressed frames via IPC, just calls `ctx.drawImage()`. No layout logic, no text rendering, no font loading needed
4. **NDI output** — receives raw BGRA pixel buffer from `canvas.getImageData()`, which is the format the NDI SDK expects
5. **Frame transfer efficiency** — at 1920×1080@30fps:
   - Raw pixels: ~250 MB/s (too much for IPC)
   - `toBlob('image/jpeg', 0.92)`: ~2-5 MB/s (efficient)
   - `ImageBitmap` via `MessagePort`: zero-copy transfer (ideal for same-process)
   - For NDI: raw BGRA is required anyway

### Benefits

- **Pixel-perfect consistency** across all outputs (one source of truth)
- **~50% less CPU** for dual-output scenarios
- **Simpler display window** — becomes a thin image viewer
- **Easy to add outputs** — NDI, recording, streaming all tap the same frame
- **No font loading issues** — only one window needs fonts

### Implementation Notes

- The main challenge is the Electron process boundary — display window is a separate renderer process
- Consider using `OffscreenCanvas` + `transferToImageBitmap()` for the main render target
- `SharedArrayBuffer` could enable zero-copy frame sharing if same-origin policies allow it
- For NDI specifically, a native Node addon (N-API) wrapping the NDI SDK would be needed

---

## NDI Output

**Priority:** Medium  
**Impact:** Professional broadcast integration  
**Status:** Idea

### Concept

Add NDI (Network Device Interface) output so the timer canvas can be received by any NDI-compatible software (OBS, vMix, Wirecast, TriCaster, etc.) on the local network.

### Requirements

- Depends on single-renderer architecture (above)
- Native Node.js addon wrapping the NDI SDK (C/C++ via N-API)
- Send raw BGRA frames from canvas at configurable frame rate
- NDI source name configurable (e.g., "Rocket Timer")
- Alpha channel support for overlay compositing

### Considerations

- NDI SDK has licensing requirements — review before distribution
- Native addon needs to be compiled per platform (Windows, macOS, Linux)
- Consider `grandiose` npm package as a starting point (NDI bindings for Node.js)

---

## Web-Based Remote Control

**Priority:** Low  
**Impact:** Convenience  
**Status:** Idea

### Concept

Serve a lightweight web UI from the API server that allows controlling the timer from any device on the network (phone, tablet, another computer) — essentially a browser-based companion panel.

### Notes

- API endpoints already exist — just needs a frontend
- Could be a simple single-page app served from the Express server
- Touch-friendly large buttons for live use
- QR code in settings to quickly connect mobile devices

---

*Last updated: March 19, 2026*
