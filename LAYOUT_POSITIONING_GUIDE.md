# Layout Positioning Guide

## Overview
The Countdown Timer uses a **hybrid positioning system** that supports three different ways to specify positions and sizes. This makes layouts easy to read, write, and understand!

## Position & Size Formats

### 1. Named Positions (Recommended ⭐)
The easiest and most readable way to position elements.

**Horizontal (x-axis)**:
- `"left"` - Align to left edge (0%)
- `"center"` - Center horizontally (50%)
- `"right"` - Align to right edge (100%)

**Vertical (y-axis)**:
- `"top"` - Align to top edge (0%)
- `"middle"` - Center vertically (50%)
- `"bottom"` - Align to bottom edge (100%)

**Example**:
```javascript
"countdown": {
  "position": { "x": "center", "y": "middle" }  // Dead center!
}
```

### 2. Percentage Strings (CSS-like)
Familiar syntax for web developers.

**Examples**:
- `"10%"` - 10% from edge
- `"25%"` - Quarter way
- `"50%"` - Halfway (same as "center"/"middle")
- `"75%"` - Three-quarters
- `"90%"` - 90% from edge

**Example**:
```javascript
"progressBar": {
  "position": { "x": "10%", "y": "5%" },
  "size": { "width": "80%", "height": "4%" }
}
```

### 3. Decimal Numbers (0-1 Range)
Backward compatible with original system.

**Examples**:
- `0` - 0% (edge)
- `0.25` - 25%
- `0.5` - 50% (center/middle)
- `0.75` - 75%
- `1.0` - 100% (opposite edge)

**Example**:
```javascript
"clock": {
  "position": { "x": 0.5, "y": 0.6 }  // Still works!
}
```

### 4. Absolute Pixels (Advanced)
For precise control (values >= 1 are treated as pixels).

**Example**:
```javascript
"message": {
  "position": { "x": 960, "y": 900 }  // Exact pixel coordinates
}
```

## Quick Reference

### Common Layout Patterns

#### Centered Element
```javascript
"element": {
  "position": { "x": "center", "y": "middle" }
}
```

#### Top Left Corner
```javascript
"element": {
  "position": { "x": "left", "y": "top" }
}
// or
"element": {
  "position": { "x": "0%", "y": "0%" }
}
```

#### Bottom Right Corner
```javascript
"element": {
  "position": { "x": "right", "y": "bottom" }
}
```

#### Centered Horizontally, 1/3 Down
```javascript
"element": {
  "position": { "x": "center", "y": "33%" }
}
```

#### Full Width Bar at Top
```javascript
"progressBar": {
  "position": { "x": "0%", "y": "5%" },
  "size": { "width": "100%", "height": "3%" }
}
```

#### Centered Bar (80% Width)
```javascript
"progressBar": {
  "position": { "x": "10%", "y": "10%" },
  "size": { "width": "80%", "height": "4%" }
}
```

## Real Layout Examples

### Classic Layout
```javascript
const classicLayout = {
  "progressBar": {
    "enabled": true,
    "position": { "x": "10%", "y": "10%" },
    "size": { "width": "80%", "height": "4%" }
  },
  "countdown": {
    "enabled": true,
    "position": { "x": "center", "y": "45%" },
    "fontSize": 200
  },
  "clock": {
    "enabled": true,
    "position": { "x": "center", "y": "60%" },
    "fontSize": 60
  },
  "separator": {
    "enabled": true,
    "position": { "y": "75%" },
    "width": "90%"
  },
  "message": {
    "enabled": true,
    "position": { "x": "center", "y": "85%" },
    "fontSize": 70
  }
}
```

### Minimal Layout
```javascript
const minimalLayout = {
  "progressBar": { "enabled": false },
  "countdown": {
    "enabled": true,
    "position": { "x": "center", "y": "40%" },
    "fontSize": 280
  },
  "clock": { "enabled": false },
  "separator": { "enabled": false },
  "message": {
    "enabled": true,
    "position": { "x": "center", "y": "75%" },
    "fontSize": 90
  }
}
```

## Tips & Best Practices

### ✅ Do's

1. **Use named positions** for common alignments:
   ```javascript
   { "x": "center", "y": "middle" }  // ✅ Clear and readable
   ```

2. **Use percentages** for proportional positioning:
   ```javascript
   { "x": "25%", "y": "33%" }  // ✅ Easy to understand
   ```

3. **Mix and match** formats:
   ```javascript
   { "x": "center", "y": "40%" }  // ✅ Perfectly fine!
   ```

4. **Use `enabled: false`** to hide elements:
   ```javascript
   "clock": { "enabled": false }  // ✅ Clean and clear
   ```

### ❌ Don'ts

1. **Avoid unclear decimals**:
   ```javascript
   { "x": 0.523, "y": 0.417 }  // ❌ Hard to visualize
   ```
   Instead:
   ```javascript
   { "x": "52%", "y": "42%" }  // ✅ Much clearer
   ```

2. **Don't use pixels unless necessary**:
   ```javascript
   { "x": 960, "y": 486 }  // ❌ Not responsive
   ```
   Instead:
   ```javascript
   { "x": "center", "y": "45%" }  // ✅ Scales to any resolution
   ```

## Creating Your Own Layout

1. **Start with a template** (copy an existing layout)
2. **Use named positions** for main alignment
3. **Fine-tune with percentages** as needed
4. **Test in the app** (changes are instant)

### Example: "Clock Only" Layout
```javascript
const clockOnlyLayout = {
  "name": "Clock Only",
  "description": "Just show the clock, nothing else",
  "resolution": { "width": 1920, "height": 1080 },
  
  "progressBar": { "enabled": false },
  
  "countdown": { "enabled": false },
  
  "clock": {
    "enabled": true,
    "position": { "x": "center", "y": "middle" },
    "fontSize": 300,
    "alignment": "center"
  },
  
  "separator": { "enabled": false },
  
  "message": { "enabled": false }
};
```

## Canvas Dimensions Reference

**Default Resolution**: 1920×1080 (16:9 aspect ratio)

**Common Positions**:
- Top: `y: "0%"` or `y: "top"`
- Upper third: `y: "33%"`
- Middle: `y: "50%"` or `y: "middle"`
- Lower third: `y: "67%"`
- Bottom: `y: "100%"` or `y: "bottom"`

**Common Sizes**:
- Full width: `width: "100%"`
- 4:5 width: `width: "80%"`
- Half width: `width: "50%"`
- Third width: `width: "33%"`

## Need Help?

Check the existing layouts in `src/renderer/layouts/layoutRegistry.js` for more examples!
