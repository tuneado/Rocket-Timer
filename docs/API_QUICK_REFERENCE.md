# Quick API Reference - New Endpoints

**Base URL:** `http://localhost:9999/api`

---

## ⏱️ Time Component Setters

```bash
# Set hours (0-99)
curl -X POST http://localhost:9999/api/timer/hours/2

# Set minutes (0-59)
curl -X POST http://localhost:9999/api/timer/minutes/30

# Set seconds (0-59)
curl -X POST http://localhost:9999/api/timer/seconds/45
```

---

## ⏱️ Quick Time Adjustments

```bash
# Add 1 minute
curl -X POST http://localhost:9999/api/timer/add-minute

# Subtract 1 minute
curl -X POST http://localhost:9999/api/timer/subtract-minute
```

---

## 🔊 Sound Control

```bash
# Mute sound
curl -X POST http://localhost:9999/api/sound/mute

# Unmute sound
curl -X POST http://localhost:9999/api/sound/unmute

# Toggle mute
curl -X POST http://localhost:9999/api/sound/toggle
```

---

## 🖼️ Feature Image Control

```bash
# Toggle feature image
curl -X POST http://localhost:9999/api/display/toggle-feature-image

# Set explicitly
curl -X POST http://localhost:9999/api/display/feature-image \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

---

## 🎨 Layout Management

```bash
# Get all layouts
curl http://localhost:9999/api/layouts

# Change layout
curl -X POST http://localhost:9999/api/layout \
  -H "Content-Type: application/json" \
  -d '{"layoutId": "minimal"}'
```

---

## 💬 Message Overlay

```bash
# Send message with duration
curl -X POST http://localhost:9999/api/message \
  -H "Content-Type: application/json" \
  -d '{"text": "Your message here", "duration": 5000}'

# Show message (persistent)
curl -X POST http://localhost:9999/api/message/show \
  -H "Content-Type: application/json" \
  -d '{"text": "Stand by..."}'

# Hide message
curl -X POST http://localhost:9999/api/message/hide

# Toggle message
curl -X POST http://localhost:9999/api/message/toggle
```

---

## ⚡ Display Effects

```bash
# Trigger flash
curl -X POST http://localhost:9999/api/display/flash \
  -H "Content-Type: application/json" \
  -d '{"cycles": 3, "duration": 500}'
```

---

## 📊 Get State

```bash
# Get current timer state
curl http://localhost:9999/api/timer/state

# Get available layouts
curl http://localhost:9999/api/layouts

# Health check
curl http://localhost:9999/api/health
```

---

## 🧪 Test All Endpoints

Run the provided test script:

```bash
./test-api-endpoints.sh
```

---

**For complete documentation, see:**
- [API_IMPLEMENTATION_COMPLETE.md](./API_IMPLEMENTATION_COMPLETE.md)
- [IMPLEMENTATION_RESULTS.md](./IMPLEMENTATION_RESULTS.md)
