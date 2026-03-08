import { useEffect, useState } from "react";
import { Camera, Download, Mic, Monitor, Play, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getItems, deleteItem, downloadBlob, formatDuration, type StoredItem } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const typeFilters = [
  { label: "All", value: undefined },
  { label: "Screen", value: "screen-recording" as const },
  { label: "Voice", value: "voice-recording" as const },
  { label: "Screenshots", value: "screenshot" as const },
];

export default function History() {
  const [items, setItems] = useState<StoredItem[]>([]);
  const [filter, setFilter] = useState<StoredItem["type"] | undefined>(undefined);
  const navigate = useNavigate();

  const loadItems = () => getItems(filter).then(setItems);

  useEffect(() => { loadItems(); }, [filter]);

  const handleDelete = async (id: string) => {
    await deleteItem(id);
    toast({ title: "Deleted" });
    loadItems();
  };

  const handleDownload = (item: StoredItem) => {
    const ext = item.format || (item.type === "screenshot" ? "png" : "webm");
    downloadBlob(item.blob, `${item.name}.${ext}`);
  };

  const iconFor = (type: StoredItem["type"]) => {
    if (type === "screenshot") return Camera;
    if (type === "voice-recording") return Mic;
    return Monitor;
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold gradient-text">History</h1>
        <p className="text-muted-foreground">Browse your recordings and screenshots</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 justify-center">
        {typeFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">No items yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const Icon = iconFor(item.type);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {item.duration != null && (
                  <p className="text-xs text-muted-foreground">Duration: {formatDuration(item.duration)}</p>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => handleDownload(item)} size="sm" variant="outline" className="flex-1">
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                  {item.type === "screenshot" && (
                    <Button onClick={() => navigate(`/editor/${item.id}`)} size="sm" variant="outline">
                      Edit
                    </Button>
                  )}
                  <Button onClick={() => handleDelete(item.id)} size="sm" variant="ghost" className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
