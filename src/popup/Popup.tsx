import { Monitor, Mic, Camera, Clock, Settings, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

const actions = [
  { icon: Monitor, label: "Record Screen", path: "/record-screen" },
  { icon: Mic, label: "Record Voice", path: "/record-voice" },
  { icon: Camera, label: "Screenshot", path: "/screenshot" },
];

const secondaryActions = [
  { icon: Clock, label: "History", path: "/history" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

function openPage(path: string) {
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.create({
      url: chrome.runtime.getURL(`index.html#${path}`),
    });
    window.close();
  } else {
    // Fallback for dev/preview (not running as extension)
    window.open(`#${path}`, "_blank");
  }
}

export default function Popup() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("capturesuite-theme");
    const dark = stored ? stored === "dark" : true;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return (
    <div className={`w-[360px] bg-background text-foreground p-4 space-y-4 ${isDark ? "dark" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0">
          <Camera className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-base gradient-text">CaptureSuite Pro</span>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => openPage(action.path)}
            className="glass-card p-3 flex flex-col items-center gap-2 rounded-xl hover:bg-primary/10 transition-all duration-200 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center group-hover:scale-110 transition-transform">
              <action.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Secondary actions */}
      <div className="flex gap-2">
        {secondaryActions.map((action) => (
          <button
            key={action.path}
            onClick={() => openPage(action.path)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <action.icon className="w-3.5 h-3.5" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Open full app */}
      <button
        onClick={() => openPage("/")}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <ExternalLink className="w-3 h-3" />
        Open Full App
      </button>
    </div>
  );
}
