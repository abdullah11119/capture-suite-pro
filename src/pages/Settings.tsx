import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Keyboard, Shield, Info } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

interface AppSettings {
  countdownDuration: number;
  defaultScreenFormat: string;
  defaultImageFormat: string;
  autoSave: boolean;
}

const defaultSettings: AppSettings = {
  countdownDuration: 3,
  defaultScreenFormat: "webm",
  defaultImageFormat: "png",
  autoSave: false,
};

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("capturesuite-settings");
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("capturesuite-settings", JSON.stringify(settings));
  }, [settings]);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const shortcuts = [
    { keys: "Alt + Shift + R", action: "Start screen recording" },
    { keys: "Alt + Shift + V", action: "Start voice recording" },
    { keys: "Alt + Shift + F", action: "Full screen capture" },
    { keys: "Alt + Shift + A", action: "Area screenshot" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground">Configure your capture preferences</p>
      </div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-muted text-sm font-medium"
          >
            {theme === "dark" ? "Dark" : "Light"}
          </button>
        </div>
      </motion.div>

      {/* Recording */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold">Recording</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Countdown Duration</span>
          <select
            value={settings.countdownDuration}
            onChange={(e) => update("countdownDuration", Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-muted text-sm border-none"
          >
            <option value={0}>None</option>
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Auto-save recordings</span>
          <button
            onClick={() => update("autoSave", !settings.autoSave)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              settings.autoSave ? "bg-primary" : "bg-muted"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-primary-foreground absolute top-0.5 transition-transform ${
                settings.autoSave ? "translate-x-6" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* Keyboard Shortcuts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <Keyboard className="w-5 h-5" />
          Keyboard Shortcuts
        </h2>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">{s.action}</span>
              <kbd className="px-2 py-1 rounded bg-muted text-xs font-mono">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          In-app shortcuts work when this app is focused. For global shortcuts, install as a Chrome extension.
        </p>
      </motion.div>

      {/* Privacy */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 space-y-3">
        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy
        </h2>
        <p className="text-sm text-muted-foreground">
          All recordings and screenshots are stored locally on your device using IndexedDB.
          No data is sent to any server. No cloud uploads. No tracking.
        </p>
      </motion.div>
    </div>
  );
}
