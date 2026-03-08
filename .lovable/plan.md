

# CaptureSuite Pro — Web-Based Capture & Recording Tool

A premium 3-in-1 productivity web app for screen recording, voice recording, and screenshots, with a built-in image editor. All data stays local on the user's device.

---

## 1. Dashboard (Landing Page)
- **Glassmorphism popup-style layout** with purple → blue → pink gradient background
- **Three large action cards**: Record Screen, Record Voice, Take Screenshot
- **Recent activity section** showing latest recordings and screenshots
- **Dark mode toggle** in the header
- Smooth hover animations on all interactive elements

## 2. Screen Recorder
- **Source selection**: Entire screen, browser tab, or application window (via `getDisplayMedia`)
- **Audio options**: Toggle microphone and system/tab audio
- **Webcam overlay**: Optional small floating camera bubble using `getUserMedia`
- **Controls**: Start, pause/resume, stop with a visible recording timer
- **Countdown timer** (3-2-1) before recording starts
- **Quality settings**: Resolution and frame rate options
- **Export**: Download as WebM (native) or converted MP4
- **Recording indicator**: Visual badge/pulse animation while recording

## 3. Voice Recorder
- **Microphone recording** via `getUserMedia` + MediaRecorder
- **Live waveform visualization** using Web Audio API + Canvas
- **Controls**: Start, pause/resume, stop
- **Export**: WAV and MP3 formats
- **Recording history**: List of past recordings stored in localStorage/IndexedDB

## 4. Screenshot Tool
- **Capture visible area**: Using `html2canvas` on the current page view
- **Full page capture**: Auto-scroll and stitch using `html2canvas`
- **Custom area selection**: Draggable selection overlay to crop a specific region
- **Instant preview** modal after capture
- **Export**: PNG, JPEG, or PDF download
- **Screenshot history**: Thumbnails stored locally with preview, download, and delete options

## 5. Built-In Image Editor
- **Canvas-based editor** opened after taking a screenshot or from history
- **Tools**: Crop, draw arrows, freehand highlight, blur regions, add text annotations, rectangles, circles, step number badges
- **Undo/redo** stack
- **Drag-and-drop** element positioning
- **Watermark option**: Add custom text watermark
- **Browser frame mockup**: Wrap screenshot in a browser chrome frame
- **Export** edited image as PNG/JPEG

## 6. Settings & Preferences
- **Keyboard shortcuts** display (informational, since web apps can't register global OS shortcuts — but in-app shortcuts will work)
- **Recording quality** presets (720p, 1080p, etc.)
- **Auto-save** toggle for recordings
- **Default export formats**
- **Watermark configuration**

## 7. UI/UX Design System
- **Gradient theme**: Purple → blue → pink with glassmorphism cards (backdrop-blur, semi-transparent backgrounds)
- **Dark mode** as default with light mode option
- **Animated buttons** with scale/glow effects on hover
- **Lucide icons** throughout
- **Smooth page transitions** between sections
- **Responsive layout** that works on all screen sizes

## 8. Data & Privacy
- All recordings, screenshots, and history stored locally using **IndexedDB** (via a lightweight wrapper)
- No backend, no cloud uploads, no data collection
- Export/download everything directly to the user's device

## Pages & Navigation
- `/` — Dashboard with 3 main action cards + recent activity
- `/record-screen` — Screen recorder interface
- `/record-voice` — Voice recorder with waveform
- `/screenshot` — Screenshot capture tool
- `/editor` — Image editor (opened with a screenshot)
- `/history` — Browse all recordings and screenshots
- `/settings` — Preferences and shortcuts

