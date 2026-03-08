import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight, Circle, Download, Highlighter, MousePointer, Redo2,
  RectangleHorizontal, Type, Undo2, Hash, Droplets
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getItem, downloadBlob } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";

type Tool = "select" | "arrow" | "rect" | "circle" | "text" | "highlight" | "step";

interface DrawAction {
  tool: Tool;
  color: string;
  lineWidth: number;
  points?: { x: number; y: number }[];
  rect?: { x: number; y: number; w: number; h: number };
  text?: string;
  textPos?: { x: number; y: number };
  stepNum?: number;
  stepPos?: { x: number; y: number };
}

export default function ImageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#8b5cf6");
  const [lineWidth, setLineWidth] = useState(3);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawAction[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stepCount, setStepCount] = useState(1);
  const [watermarkText, setWatermarkText] = useState("");
  const [showWatermark, setShowWatermark] = useState(false);
  const currentAction = useRef<DrawAction | null>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const redraw = useCallback((allActions: DrawAction[], wmText?: string) => {
    const canvas = canvasRef.current;
    const img = bgImageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const action of allActions) {
      ctx.strokeStyle = action.color;
      ctx.fillStyle = action.color;
      ctx.lineWidth = action.lineWidth;
      ctx.lineCap = "round";

      if (action.tool === "arrow" && action.points && action.points.length >= 2) {
        const start = action.points[0];
        const end = action.points[action.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }

      if (action.tool === "rect" && action.rect) {
        ctx.strokeRect(action.rect.x, action.rect.y, action.rect.w, action.rect.h);
      }

      if (action.tool === "circle" && action.rect) {
        const cx = action.rect.x + action.rect.w / 2;
        const cy = action.rect.y + action.rect.h / 2;
        const rx = Math.abs(action.rect.w) / 2;
        const ry = Math.abs(action.rect.h) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (action.tool === "highlight" && action.points && action.points.length >= 2) {
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (const p of action.points) ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = action.lineWidth;
      }

      if (action.tool === "text" && action.text && action.textPos) {
        ctx.font = "bold 18px Inter, sans-serif";
        ctx.fillText(action.text, action.textPos.x, action.textPos.y);
      }

      if (action.tool === "step" && action.stepNum && action.stepPos) {
        const r = 16;
        ctx.beginPath();
        ctx.arc(action.stepPos.x, action.stepPos.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(action.stepNum), action.stepPos.x, action.stepPos.y);
        ctx.textAlign = "start";
        ctx.textBaseline = "alphabetic";
      }
    }

    // Draw watermark
    const wm = wmText ?? watermarkText;
    if (wm) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.font = `bold ${Math.max(24, canvas.width / 20)}px Space Grotesk, sans-serif`;
      ctx.fillStyle = "#888888";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Tiled diagonal watermark
      const diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      const spacing = Math.max(120, canvas.width / 5);
      for (let y = -diag; y < diag; y += spacing) {
        for (let x = -diag; x < diag; x += spacing * 2) {
          ctx.fillText(wm, x, y);
        }
      }
      ctx.restore();
    }
  }, [watermarkText]);

  useEffect(() => {
    if (!id) return;
    getItem(id).then((item) => {
      if (!item) {
        toast({ title: "Not found", variant: "destructive" });
        navigate("/history");
        return;
      }
      const img = new Image();
      img.onload = () => {
        bgImageRef.current = img;
        const canvas = canvasRef.current!;
        const scale = Math.min(1, 900 / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        redraw([]);
      };
      img.src = URL.createObjectURL(item.blob);
    });
  }, [id, navigate, redraw]);

  // Re-draw when watermark changes
  useEffect(() => {
    redraw(actions, watermarkText);
  }, [watermarkText]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0] || (e as any).changedTouches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === "select") return;
    const pos = getPos(e);
    startPos.current = pos;
    setIsDrawing(true);

    if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        const action: DrawAction = { tool: "text", color, lineWidth, text, textPos: pos };
        setActions((prev) => { const n = [...prev, action]; redraw(n); return n; });
        setRedoStack([]);
      }
      setIsDrawing(false);
      return;
    }

    if (tool === "step") {
      const action: DrawAction = { tool: "step", color, lineWidth, stepNum: stepCount, stepPos: pos };
      setActions((prev) => { const n = [...prev, action]; redraw(n); return n; });
      setRedoStack([]);
      setStepCount((c) => c + 1);
      setIsDrawing(false);
      return;
    }

    currentAction.current = {
      tool,
      color,
      lineWidth,
      points: tool === "arrow" || tool === "highlight" ? [pos] : undefined,
      rect: tool === "rect" || tool === "circle" ? { x: pos.x, y: pos.y, w: 0, h: 0 } : undefined,
    };
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentAction.current) return;
    if ("touches" in e) e.preventDefault();
    const pos = getPos(e);

    if (currentAction.current.tool === "arrow" || currentAction.current.tool === "highlight") {
      currentAction.current.points!.push(pos);
    }
    if (currentAction.current.tool === "rect" || currentAction.current.tool === "circle") {
      currentAction.current.rect = {
        x: Math.min(startPos.current.x, pos.x),
        y: Math.min(startPos.current.y, pos.y),
        w: Math.abs(pos.x - startPos.current.x),
        h: Math.abs(pos.y - startPos.current.y),
      };
    }
    redraw([...actions, currentAction.current]);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentAction.current) return;
    setIsDrawing(false);
    setActions((prev) => {
      const n = [...prev, currentAction.current!];
      redraw(n);
      return n;
    });
    setRedoStack([]);
    currentAction.current = null;
  };

  const undo = () => {
    if (actions.length === 0) return;
    const last = actions[actions.length - 1];
    setRedoStack((prev) => [...prev, last]);
    const newActions = actions.slice(0, -1);
    setActions(newActions);
    redraw(newActions);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    const newActions = [...actions, last];
    setActions(newActions);
    redraw(newActions);
  };

  const handleExport = (format: "png" | "jpeg") => {
    const canvas = canvasRef.current!;
    canvas.toBlob(
      (blob) => blob && downloadBlob(blob, `edited-${Date.now()}.${format}`),
      format === "jpeg" ? "image/jpeg" : "image/png",
      0.92
    );
  };

  const tools: { id: Tool; icon: React.ElementType; label: string }[] = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "arrow", icon: ArrowRight, label: "Arrow" },
    { id: "rect", icon: RectangleHorizontal, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "highlight", icon: Highlighter, label: "Highlight" },
    { id: "text", icon: Type, label: "Text" },
    { id: "step", icon: Hash, label: "Step #" },
  ];

  const colors = ["#8b5cf6", "#3b82f6", "#ec4899", "#ef4444", "#22c55e", "#f59e0b", "#000000", "#ffffff"];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-display font-bold gradient-text">Image Editor</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Annotate and edit your screenshot</p>
      </div>

      {/* Toolbar */}
      <div className="glass-card p-2 sm:p-3 flex flex-wrap items-center gap-1.5 sm:gap-2 justify-center">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
              tool === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}
            title={t.label}
          >
            <t.icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        ))}
        <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1" />
        <div className="flex gap-1 flex-wrap justify-center">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-transform ${
                color === c ? "border-foreground scale-125" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="w-px h-5 sm:h-6 bg-border mx-0.5 sm:mx-1" />
        <Button onClick={undo} variant="ghost" size="icon" title="Undo" className="h-8 w-8 sm:h-10 sm:w-10">
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button onClick={redo} variant="ghost" size="icon" title="Redo" className="h-8 w-8 sm:h-10 sm:w-10">
          <Redo2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Watermark */}
      <div className="glass-card p-3 sm:p-4">
        <button
          onClick={() => setShowWatermark(!showWatermark)}
          className="flex items-center gap-2 text-sm font-medium w-full"
        >
          <Droplets className="w-4 h-4 text-primary" />
          Watermark
          <span className="text-xs text-muted-foreground ml-auto">
            {watermarkText ? "Active" : "Off"}
          </span>
        </button>
        {showWatermark && (
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Enter watermark text..."
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setWatermarkText(""); }}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 justify-center flex-wrap">
        <Button onClick={() => handleExport("png")} size="sm" className="gradient-bg text-primary-foreground">
          <Download className="w-4 h-4 mr-1" /> PNG
        </Button>
        <Button onClick={() => handleExport("jpeg")} size="sm" variant="outline">
          <Download className="w-4 h-4 mr-1" /> JPEG
        </Button>
      </div>

      {/* Canvas */}
      <div className="glass-card p-2 sm:p-4 flex justify-center overflow-auto touch-none">
        <canvas
          ref={canvasRef}
          className="max-w-full cursor-crosshair rounded-lg"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>
    </div>
  );
}
