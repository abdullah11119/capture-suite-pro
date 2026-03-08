import { Link } from "react-router-dom";
import { Monitor, Mic, Camera, Play, Image, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getItems, type StoredItem, formatDuration } from "@/lib/storage";

const actions = [
  {
    title: "Record Screen",
    description: "Capture your screen, tab, or window with audio",
    icon: Monitor,
    path: "/record-screen",
    gradient: "from-primary to-secondary",
  },
  {
    title: "Record Voice",
    description: "Record microphone audio with waveform visualization",
    icon: Mic,
    path: "/record-voice",
    gradient: "from-secondary to-accent",
  },
  {
    title: "Take Screenshot",
    description: "Capture visible area or select a custom region",
    icon: Camera,
    path: "/screenshot",
    gradient: "from-accent to-primary",
  },
];

export default function Index() {
  const [recentItems, setRecentItems] = useState<StoredItem[]>([]);

  useEffect(() => {
    getItems().then((items) => setRecentItems(items.slice(0, 6)));
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-bold gradient-text"
        >
          CaptureSuite Pro
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg max-w-md mx-auto"
        >
          Your all-in-one screen recorder, voice recorder, and screenshot tool
        </motion.p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {actions.map((action, i) => (
          <motion.div
            key={action.path}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
          >
            <Link to={action.path} className="block group">
              <div className="glass-card p-8 text-center space-y-5 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/10">
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center glow-btn`}
                >
                  <action.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold">{action.title}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{action.description}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </h2>
          <Link to="/history" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No captures yet. Start recording or take a screenshot!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.map((item) => (
              <div key={item.id} className="glass-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {item.type === "screenshot" ? (
                    <Camera className="w-4 h-4 text-accent" />
                  ) : item.type === "voice-recording" ? (
                    <Mic className="w-4 h-4 text-secondary" />
                  ) : (
                    <Play className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  {item.duration != null && <span>{formatDuration(item.duration)}</span>}
                  <span className="uppercase">{item.format}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Keyboard shortcuts hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="glass-card p-4 text-center text-sm text-muted-foreground"
      >
        <span className="font-medium text-foreground">Keyboard Shortcuts:</span>{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Alt+Shift+R</kbd> Screen{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Alt+Shift+V</kbd> Voice{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Alt+Shift+F</kbd> Screenshot
      </motion.div>
    </div>
  );
}
