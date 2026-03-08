import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Crop, Download, Edit, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveItem, downloadBlob, generateId } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Screenshot() {
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const navigate = useNavigate();

  const captureVisible = useCallback(async () => {
    setIsCapturing(true);
    try {
      // Use getDisplayMedia to capture the screen, then grab a frame
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      // Wait a frame for video to render
      await new Promise((r) => setTimeout(r, 200));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      canvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedUrl(URL.createObjectURL(blob));
        }
        setIsCapturing(false);
      }, "image/png");
    } catch (err: any) {
      setIsCapturing(false);
      if (err.name !== "NotAllowedError") {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  }, []);

  const startAreaSelection = () => {
    setSelectionMode(true);
    setSelection(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectionMode) return;
    const rect = overlayRef.current!.getBoundingClientRect();
    startRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setSelection({ x: startRef.current.x, y: startRef.current.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionMode || !selection) return;
    const rect = overlayRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setSelection({
      x: Math.min(startRef.current.x, cx),
      y: Math.min(startRef.current.y, cy),
      w: Math.abs(cx - startRef.current.x),
      h: Math.abs(cy - startRef.current.y),
    });
  };

  const handleMouseUp = async () => {
    if (!selectionMode || !selection || selection.w < 10 || selection.h < 10) {
      setSelectionMode(false);
      setSelection(null);
      return;
    }

    setSelectionMode(false);

    // Capture the screen first, then crop
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => setTimeout(r, 200));

      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = video.videoWidth;
      fullCanvas.height = video.videoHeight;
      fullCanvas.getContext("2d")!.drawImage(video, 0, 0);
      stream.getTracks().forEach((t) => t.stop());

      // Scale selection to video coordinates
      const overlay = overlayRef.current!;
      const scaleX = video.videoWidth / overlay.clientWidth;
      const scaleY = video.videoHeight / overlay.clientHeight;

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = selection.w * scaleX;
      cropCanvas.height = selection.h * scaleY;
      cropCanvas.getContext("2d")!.drawImage(
        fullCanvas,
        selection.x * scaleX,
        selection.y * scaleY,
        selection.w * scaleX,
        selection.h * scaleY,
        0, 0,
        cropCanvas.width,
        cropCanvas.height
      );

      cropCanvas.toBlob((blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setCapturedUrl(URL.createObjectURL(blob));
        }
      }, "image/png");
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
    setSelection(null);
  };

  const handleSave = async () => {
    if (!capturedBlob) return;
    const id = generateId();
    await saveItem({
      id,
      type: "screenshot",
      name: `Screenshot ${new Date().toLocaleString()}`,
      blob: capturedBlob,
      createdAt: Date.now(),
      format: "png",
    });
    toast({ title: "Saved!", description: "Screenshot saved to history." });
  };

  const handleDownload = (format: "png" | "jpeg") => {
    if (!capturedBlob) return;
    if (format === "jpeg") {
      const img = new window.Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d")!.drawImage(img, 0, 0);
        c.toBlob((b) => b && downloadBlob(b, `screenshot-${Date.now()}.jpeg`), "image/jpeg", 0.92);
      };
      img.src = URL.createObjectURL(capturedBlob);
    } else {
      downloadBlob(capturedBlob, `screenshot-${Date.now()}.png`);
    }
  };

  const openEditor = async () => {
    if (!capturedBlob) return;
    const id = generateId();
    await saveItem({
      id,
      type: "screenshot",
      name: `Screenshot ${new Date().toLocaleString()}`,
      blob: capturedBlob,
      createdAt: Date.now(),
      format: "png",
    });
    navigate(`/editor/${id}`);
  };

  const reset = () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setCapturedBlob(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold gradient-text">Screenshot Tool</h1>
        <p className="text-muted-foreground">Capture your screen or select a custom area</p>
      </div>

      <div className="glass-card overflow-hidden">
        {capturedUrl ? (
          <div className="relative">
            <img src={capturedUrl} alt="Screenshot" className="w-full" />
          </div>
        ) : (
          <div
            ref={overlayRef}
            className="aspect-video bg-muted/30 flex items-center justify-center relative cursor-crosshair select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {selectionMode && selection && selection.w > 0 && (
              <div
                className="absolute border-2 border-primary bg-primary/10 rounded"
                style={{
                  left: selection.x,
                  top: selection.y,
                  width: selection.w,
                  height: selection.h,
                }}
              />
            )}
            {selectionMode ? (
              <p className="text-muted-foreground pointer-events-none">
                Draw a rectangle to select an area
              </p>
            ) : (
              <div className="text-center space-y-3 pointer-events-none">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground">Choose a capture method below</p>
              </div>
            )}
          </div>
        )}

        <div className="p-6 space-y-4">
          {!capturedUrl && !selectionMode && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                onClick={captureVisible}
                disabled={isCapturing}
                className="glow-btn gradient-bg text-primary-foreground h-12"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture Screen
              </Button>
              <Button onClick={startAreaSelection} variant="outline" className="h-12">
                <Crop className="w-4 h-4 mr-2" />
                Select Area
              </Button>
            </div>
          )}

          {capturedUrl && (
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => handleDownload("png")} className="glow-btn gradient-bg text-primary-foreground">
                <Download className="w-4 h-4 mr-2" /> PNG
              </Button>
              <Button onClick={() => handleDownload("jpeg")} variant="outline">
                <Download className="w-4 h-4 mr-2" /> JPEG
              </Button>
              <Button onClick={openEditor} variant="outline">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button onClick={handleSave} variant="outline">
                Save to History
              </Button>
              <Button onClick={reset} variant="ghost">
                New Screenshot
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
