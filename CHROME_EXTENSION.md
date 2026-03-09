# CaptureSuite Pro — Chrome Extension

## How to build & install

### 1. Build the extension
```bash
npm run build
```
This creates a `dist/` folder with the extension output.

### 2. Load in Chrome
1. Open **Chrome** and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **"Load unpacked"**
4. Select the **`dist/`** folder from this project
5. The CaptureSuite Pro icon will appear in your Chrome toolbar!

### 3. Pin the extension
Click the puzzle piece icon in the Chrome toolbar and pin **CaptureSuite Pro** for quick access.

---

## How it works

- **Click the toolbar icon** → Opens a compact launcher popup with quick access to all tools
- **Each button opens a full tab** with the selected tool (Screen Recorder, Voice Recorder, Screenshot, etc.)
- **All data stays local** — recordings and screenshots are stored in IndexedDB on your device, never sent anywhere

## Keyboard shortcuts (in-app)
| Shortcut | Action |
|---|---|
| `Alt + Shift + R` | Open Screen Recorder |
| `Alt + Shift + V` | Open Voice Recorder |
| `Alt + Shift + F` | Open Screenshot Tool |
